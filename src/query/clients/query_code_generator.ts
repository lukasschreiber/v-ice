import { AST, ASTNodeKind, ASTNode, isOperationNode, isPrimitiveNode, isSetNode, ASTSetNode, ASTEdge } from "../builder/ast";
import { TypeChecker } from "@/data/type_checker";
import { OperationNodeQueryTransformerDefinition, PrimitiveNodeQueryTransformerDefinition, QueryFunctionTransformer, QueryTransformerDefinition, QueryTransformerForNode, SetNodeQueryTransformerDefinition, TransformerKind } from "./query_transformer";
import types from "@/data/types";
import { traverseASTReverse } from "../builder/ast_traverser";
import { SerializedEdge } from "@/utils/edges";

export interface QueryGeneratorParams {
    transformers: QueryTransformerDefinition[];
    formatCode?: (code: string) => Promise<string>;
    verifyCode?: (code: string) => Promise<boolean>;
    optimizeCode?: (code: string) => Promise<string>;
    ambientFunctions?: string[];
}

export class QueryCodeGenerator {
    protected transformers: TransformerIndex;
    protected generatedCodeMap: Map<string, string> = new Map()

    constructor(protected params: QueryGeneratorParams) {
        this.transformers = this.buildTransformerIndex(params.transformers);
        this.formatCode = params.formatCode || this.formatCode
        this.optimizeCode = params.optimizeCode || this.optimizeCode
        this.verifyCode = params.verifyCode || this.verifyCode
    }

    public generateCode(ast: AST): Promise<string> {
        return new Promise((resolve) => {
            const clonedAST: AST = JSON.parse(JSON.stringify(ast))
            // each set can have one or more (named) inputs
            // each input is connected to one or more sets and the connection point is specified
            // Each edge count therefore only contains one distint set
            const edgeSetMap: Map<string, SerializedEdge> = new Map()
            const setMap: Map<string, ASTSetNode> = new Map()
            traverseASTReverse(clonedAST, {
                visit: (node) => {
                    if (isSetNode(node)) {
                        setMap.set(node.attributes.id, node)
                    }

                    if (isSetNode(node) && node.inputs) {
                        for (const [name, edges] of Object.entries(node.inputs)) {
                            for (const edge of edges) {
                                edgeSetMap.set(`${edge.connectedSetId}-${edge.connectionPoint ?? "source"}_${node.attributes.id}-${name}`, {
                                    sourceBlockId: edge.connectedSetId,
                                    targetBlockId: node.attributes.id,
                                    sourceField: edge.connectionPoint ?? "source",
                                    targetField: name
                                })
                            }
                        }
                    }

                    if (isSetNode(node) && !node.operations) return;

                    const transformer = this.getTransformerForNode(node)
                    if (isOperationNode(node)) {
                        for (const [name, arg] of Object.entries(node.args)) {
                            // TODO this is really bad
                            // @ts-ignore
                            node.args[name] = this.generatedCodeMap.get(this.getNodeHash(arg))
                        }
                    }

                    if (isSetNode(node) && node.operations) {
                        // @ts-ignore
                        node.operations = node.operations.map(op => {
                            return this.generatedCodeMap.get(this.getNodeHash(op)) || ""
                        })
                    }

                    this.generatedCodeMap.set(this.getNodeHash(node), transformer(node))
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
            const queryFunction = this.getQueryFunctionTransformer()?.(clonedAST.root, clonedAST.sets, clonedAST.targets, edgeSetMapResolved)
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

    private getQueryFunctionTransformer(): QueryFunctionTransformer | undefined {
        return this.params.transformers.find(def => def.kind === TransformerKind.QueryFunction)?.transformer as QueryFunctionTransformer | undefined
    }

    private getTransformerForNode<K extends ASTNodeKind>(node: ASTNode<K>): QueryTransformerForNode {
        let transformer: QueryTransformerForNode | null = null
        if (isOperationNode(node)) {
            const operation = node.operation
            transformer = this.transformers[ASTNodeKind.Operation][operation]?.find(def => {
                return Object.entries(node.args).every(([name, _type]) => {
                    // TODO: check type compatibility
                    return name in def.args
                })
            })?.transformer || null
        }

        if (isPrimitiveNode(node)) {
            transformer = this.transformers[ASTNodeKind.Primitive].find(def => {
                return node.type === null ? false : TypeChecker.checkTypeCompatibility(def.type, types.utils.fromString(node.type))
            })?.transformer || null
        }

        if (isSetNode(node)) {
            let blockName = "operations" in node ? "subset_node" : "inputs" in node ? "target_node" : "source_node"
            transformer = this.transformers[ASTNodeKind.Set][blockName]?.transformer || null
        }

        if (!transformer) {
            console.warn(`No transformer found for node: ${JSON.stringify(node)}, kind: ${node.kind} - returning default transformer`)
            transformer = (astNode: any) => `/* No transformer found for node: ${JSON.stringify(astNode)} */`
        }

        return transformer
    }

    protected getNodeHash(node: ASTNode<ASTNodeKind>): string {
        const string = JSON.stringify(node)
        let hash = 0;
        for (var i = 0; i < string.length; i++) {
            let code = string.charCodeAt(i);
            hash = ((hash<<5)-hash)+code;
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