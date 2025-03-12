import { AST, ASTNodeKind, ASTNode, isOperationNode, isPrimitiveNode, isSetNode, ASTSetNode, ASTEdge, ASTOperationNode, ASTPrimitiveNode } from "../builder/ast";
import { TypeChecker } from "@/data/type_checker";
import { NodeTransformerFn, OperationNodeQueryTransformerDefinition, PrimitiveNodeQueryTransformerDefinition, QueryTransformerDefinition, QueryTransformerFn, QueryTransformerUtils, SetNodeQueryTransformerDefinition, TransformerKind } from "./query_transformer";
import types, { IType } from "@/data/types";
import { traverseASTReverse } from "../builder/ast_traverser";
import { SerializedEdge } from "@/utils/edges";
import { convertToEvaluatedAST, eAST, isEvaluatedOperationNode, isEvaluatedSetNode } from "../builder/evaluated_ast";
import { NameManager } from "./query_name_manager";

export interface QueryGeneratorParams {
    transformers: QueryTransformerDefinition[];
    formatCode?: (code: string) => Promise<string>;
    verifyCode?: (code: string) => Promise<boolean>;
    optimizeCode?: (code: string) => Promise<string>;
    ambientFunctions?: string[];
    nameManager?: NameManager;
}

export class QueryCodeGenerator {
    protected transformers: TransformerIndex;
    protected generatedCodeMap: Map<string, string> = new Map()
    protected nameManager?: NameManager = undefined

    constructor(protected params: QueryGeneratorParams) {
        this.transformers = this.buildTransformerIndex(params.transformers);
        this.formatCode = params.formatCode || this.formatCode
        this.optimizeCode = params.optimizeCode || this.optimizeCode
        this.verifyCode = params.verifyCode || this.verifyCode
        this.nameManager = params.nameManager
    }

    public generateCode(ast: AST): Promise<string> {
        this.nameManager?.reset()
        return new Promise((resolve) => {
            const clonedAST: eAST = convertToEvaluatedAST(JSON.parse(JSON.stringify(ast)))
            // each set can have one or more (named) inputs
            // each input is connected to one or more sets and the connection point is specified
            // Each edge count therefore only contains one distint set
            const edgeSetMap: Map<string, SerializedEdge> = new Map()
            const setMap: Map<string, ASTSetNode> = new Map()
            traverseASTReverse(clonedAST, {
                visit: (node) => {
                    if (isEvaluatedSetNode(node)) {
                        setMap.set(node.attributes.id, node)
                    }

                    if (isEvaluatedSetNode(node) && node.inputs) {
                        for (const [name, edges] of Object.entries(node.inputs)) {
                            for (const edge of edges) {
                                edgeSetMap.set(`${edge.connectedSetId}-${edge.connectionPoint ?? "output"}_${node.attributes.id}-${name}`, {
                                    sourceBlockId: edge.connectedSetId,
                                    targetBlockId: node.attributes.id,
                                    sourceField: edge.connectionPoint ?? "output", // output is the name of the output on the source block
                                    targetField: name
                                })
                            }
                        }
                    }

                    if (isEvaluatedSetNode(node) && !node.operations) return;

                    const transformer = this.getTransformerForNode(node)
                    if (isEvaluatedOperationNode(node)) {
                        const args = typeof node.args === "function" ? node.args(node) : node.args;
                        for (const [name, arg] of Object.entries(args)) {
                            // TODO: check why this is an array here
                            node.evaluatedArgs[name] = this.generatedCodeMap.get(this.getNodeHash(Array.isArray(arg) ? arg[0] : arg)) || ""
                        }
                    }

                    if (isEvaluatedSetNode(node) && node.operations) {
                        node.evaluatedOperations = node.operations.map(op => {
                            return this.generatedCodeMap.get(this.getNodeHash(op)) || ""
                        })
                    }

                    // TODO: This is a huge hack
                    const nodeClone = JSON.parse(JSON.stringify(node))

                    if (nodeClone.hasOwnProperty("evaluatedOperations")) {
                        nodeClone.operations = nodeClone.evaluatedOperations
                    } else if (nodeClone.hasOwnProperty("evaluatedArgs")) {
                        nodeClone.args = nodeClone.evaluatedArgs
                    }

                    this.generatedCodeMap.set(this.getNodeHash(node), transformer(nodeClone, this.getQueryTransformerUtils(node.kind, node)))
                }
            })

            const ambientFunctions = (this.params.ambientFunctions || []).join("\n\n")
            const sets = clonedAST.sets.map(set => this.generatedCodeMap.get(this.getNodeHash(set)) || "").join("\n\n")
            const edgeSetMapResolved: Map<string, ASTEdge> = new Map()
            for (const [hash, set] of edgeSetMap) {
                edgeSetMapResolved.set(hash, {
                    sourceBlock: setMap.get(set.sourceBlockId)!,
                    sourceField: set.sourceField,
                    targetBlock: setMap.get(set.targetBlockId)!,
                    targetField: set.targetField
                })
            }
            const queryFunction = this.getQueryFunctionTransformer()?.(clonedAST.root, clonedAST.sets, clonedAST.targets, edgeSetMapResolved, this.baseUtils)
            if (queryFunction) {
                return resolve(`${ambientFunctions}\n\n${sets}\n\n${queryFunction}`)
            }

            return resolve(`${ambientFunctions}\n\n${sets}`)
        })
    }

    private buildTransformerIndex(transformers: QueryTransformerDefinition[]): TransformerIndex {
        return {
            [ASTNodeKind.Operation]: transformers.reduce((acc, transformer) => {
                if (transformer.kind === ASTNodeKind.Operation) {
                    const operation = transformer.operation
                    if (!acc[operation]) {
                        acc[operation] = []
                    }
                    acc[operation].push(transformer)
                }
                return acc
            }, {} as TransformerIndex[ASTNodeKind.Operation]),
            [ASTNodeKind.Primitive]: transformers.reduce((acc, transformer) => {
                if (transformer.kind === ASTNodeKind.Primitive) {
                    acc.push(transformer)
                }
                return acc
            }, [] as TransformerIndex[ASTNodeKind.Primitive]),
            [ASTNodeKind.Set]: transformers.reduce((acc, transformer) => {
                if (transformer.kind === ASTNodeKind.Set) {
                    acc[transformer.blockName] = transformer
                }
                return acc
            }, {} as TransformerIndex[ASTNodeKind.Set])
        }
    }

    private getQueryFunctionTransformer(): QueryTransformerFn | undefined {
        return this.params.transformers.find(def => def.kind === TransformerKind.QueryFunction)?.transformer as QueryTransformerFn | undefined
    }

    private getTransformerForNode<K extends ASTNodeKind, N extends ASTNode<K>>(node: N): NodeTransformerFn<K, N> {
        let transformer: NodeTransformerFn<K, N> | null = null

        if (isOperationNode(node)) {
            const operation = node.operation;
            const args = typeof node.args === "function" ? node.args(node) : node.args;
            
            const filteredTransformers = (this.transformers[ASTNodeKind.Operation][operation]?.filter(def => {
                return Object.entries(args).every(([name, child]) => {
                    const defArgs: Record<string, IType> = typeof def.args === "function" ? def.args(node) : def.args;
                    if (!(name in defArgs)) return false;
                    // TODO: check type compatibility
                    // @ts-ignore
                    if (!TypeChecker.checkTypeCompatibility(defArgs[name], types.utils.fromString(child.type))) return false;
                    return true;
                });
            }) || []);
            
            transformer = (filteredTransformers.length > 0 ? filteredTransformers[0].transformer : null) as NodeTransformerFn<K, N> | null;
        }        

        if (isPrimitiveNode(node)) {
            const eligibleTransformers = this.transformers[ASTNodeKind.Primitive].filter(def => {
                return node.type === null ? false : TypeChecker.checkTypeCompatibility(def.type, types.utils.fromString(node.type))
            })

            if (eligibleTransformers.length === 1) {
                transformer = eligibleTransformers[0].transformer as NodeTransformerFn<K, N>
            }

            // if there are multiple transformers that can handle the node, we choose the one with the most specific type, i.e. the one with the least union types or wildcards
            eligibleTransformers.sort((a, b) => {
                const aType = types.utils.fromString(a.type)
                const bType = types.utils.fromString(b.type)
                const aLevel = types.utils.isUnion(aType) ? aType.types.length : types.utils.isWildcard(aType) ? 10 : 1
                const bLevel = types.utils.isUnion(bType) ? bType.types.length : types.utils.isWildcard(bType) ? 10 : 1
                return aLevel - bLevel
            })

            if (eligibleTransformers.length > 1) {
                console.warn(`Multiple transformers found for node: ${JSON.stringify(node)}, kind: ${node.kind} - choosing the one with the most specific type`)
                transformer = eligibleTransformers[0].transformer as NodeTransformerFn<K, N>
            }
        }

        if (isSetNode(node)) {
            let blockName = "operations" in node ? "subset_node" : "inputs" in node ? "target_node" : "source_node"
            transformer = (this.transformers[ASTNodeKind.Set][blockName]?.transformer || null) as NodeTransformerFn<K, N> | null
        }

        if (!transformer) {
            console.warn(`No transformer found for node: ${JSON.stringify(node)}, kind: ${node.kind} - returning default transformer`)
            if (isPrimitiveNode(node)) {
                transformer = () => `undefined`
            } else {
                transformer = (astNode: any) => `/* No transformer found for node: ${JSON.stringify(astNode)} */`
            }
        }

        return transformer
    }

    private readonly baseUtils = {
        getName: (id: string) => this.getName(id),
        createName: (id: string, name: string) => this.createName(id, name),
    }

    private getQueryTransformerUtils<NodeKind extends ASTNodeKind>(
        kind: NodeKind,
        node: ASTNode<NodeKind>
    ): QueryTransformerUtils<NodeKind> {
        switch (kind) {
            case ASTNodeKind.Set:
                return {
                    ...this.baseUtils,
                    useAlias: (astNode: ASTSetNode) => this.getTransformerForNode(astNode)(astNode, this.getQueryTransformerUtils(ASTNodeKind.Set, astNode)),
                } as QueryTransformerUtils<NodeKind>;
    
            case ASTNodeKind.Operation:
                const opNode = node as ASTOperationNode;
                const args = typeof opNode.args === "function" ? opNode.args(opNode) : opNode.args;
                return {
                    definition: {
                        // TODO: check for array
                        args: Object.entries(args).reduce((acc, [name, child]) => {
                            // @ts-ignore
                            acc[name] = types.utils.fromString(child.type)
                            return acc
                        }, {} as { [key: string]: IType }),
                    },
                    ...this.baseUtils,
                    useAlias: (astNode: ASTOperationNode, _operation: string, _args: { [key: string]: IType }) => this.getTransformerForNode(astNode)(astNode, this.getQueryTransformerUtils(ASTNodeKind.Operation, astNode)),
                } as unknown as QueryTransformerUtils<NodeKind>;
    
            case ASTNodeKind.Primitive:
                return {
                    ...this.baseUtils,
                    useAlias: (astNode: ASTPrimitiveNode, _operation: string, _type: IType) => this.getTransformerForNode(astNode)(astNode, this.getQueryTransformerUtils(ASTNodeKind.Primitive, astNode)),
                } as QueryTransformerUtils<NodeKind>;
    
            default:
                throw new Error(`Unsupported ASTNodeKind: ${kind}`);
        }
    }

    protected createName(id: string, name: string): string {
        return this.nameManager?.createUniqueName(id, name) || id
    }

    protected getName(id: string): string {
        return this.nameManager?.getName(id) || id
    }

    protected getNodeHash(node: ASTNode<ASTNodeKind>): string {
        const string = JSON.stringify(node)
        let hash = 0;
        for (var i = 0; i < string.length; i++) {
            let code = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + code;
            hash = hash & hash;
        }
        return `ASTNode<${hash}>`;
    }

    public async formatCode(code: string): Promise<string> {
        return new Promise(resolve => resolve(code))
    }

    public async optimizeCode(code: string): Promise<string> {
        return new Promise(resolve => resolve(code))
    }

    public async verifyCode(_code: string): Promise<boolean> {
        return new Promise(resolve => resolve(true))
    }
}

type TransformerIndex = {
    [ASTNodeKind.Operation]: {
        [operation: string]: OperationNodeQueryTransformerDefinition<any>[]
    },
    [ASTNodeKind.Primitive]: PrimitiveNodeQueryTransformerDefinition<any>[],
    [ASTNodeKind.Set]: {
        [blockName: string]: SetNodeQueryTransformerDefinition
    }
}