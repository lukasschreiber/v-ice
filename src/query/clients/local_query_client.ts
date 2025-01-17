import { QueryClient, QueryClientParams } from "@/query/clients/query_client";
import { AST, ASTNodeKind, ASTNode, isOperationNode, isPrimitiveNode, isSetNode } from "../builder/ast";
import { LocalQueryVerificator } from "./local_query_verificator";
import { LocalQueryRuntime } from "./local_query_runtime";
import { OperationNodeQueryTransformerDefinition, PrimitiveNodeQueryTransformerDefinition, QueryTransformerDefinition, QueryTransformerForNode, QueryTransformerForOperationNode, QueryTransformerForPrimitiveNode, SetNodeQueryTransformerDefinition } from "./query_transformer";
import { traverseASTReverse } from "../builder/ast_traverser";
import { TypeChecker } from "@/data/type_checker";
import types from "@/data/types";

export interface LocalQueryClientParams extends QueryClientParams<"local"> {
    mode: "local";
    verificator: LocalQueryVerificator;
    runtime: LocalQueryRuntime;
    transformers: QueryTransformerDefinition[];
}

export class LocalQueryClient extends QueryClient {
    protected verificator: LocalQueryVerificator;
    protected runtime: LocalQueryRuntime;
    protected transformers: TransformerIndex;

    constructor(params: LocalQueryClientParams) {
        super(params);
        this.verificator = params.verificator;
        this.runtime = params.runtime;
        this.transformers = this.buildTransformerIndex(params.transformers);
    }

    public async execute(query: string): Promise<any> {
        return this.runtime.execute(query);
    }

    public verify(query: string): boolean {
        return this.verificator.verify(query);
    }

    public astToQueryCode(ast: AST): string {
        const outerThis = this
        console.log(this.transformers)
        traverseASTReverse(ast, {
            visit(node) {
                console.log("Visiting node: ", node, outerThis.getTransformerForNode(node)(node));
            }
        })

        return "Local query code"
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

    private getTransformerForNode<K extends ASTNodeKind>(node: ASTNode<K>): QueryTransformerForNode {
        let transformer: QueryTransformerForNode | null = null
        if (isOperationNode(node)) {
            const operation = node.operation
            transformer = this.transformers[ASTNodeKind.Operation][operation]?.find(def => {
                return Object.entries(node.args).every(([name, type]) => {
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