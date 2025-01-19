import { AST, ASTNodeKind, ASTNode, isOperationNode, isPrimitiveNode, isSetNode } from "../builder/ast";
import { TypeChecker } from "@/data/type_checker";
import { OperationNodeQueryTransformerDefinition, PrimitiveNodeQueryTransformerDefinition, QueryTransformerDefinition, QueryTransformerForNode, SetNodeQueryTransformerDefinition } from "./query_transformer";
import types from "@/data/types";

export interface QueryGeneratorParams {
    transformers: QueryTransformerDefinition[];
}

export abstract class QueryCodeGenerator {
    protected transformers: TransformerIndex;

    constructor(protected params: QueryGeneratorParams) {
        this.transformers = this.buildTransformerIndex(params.transformers);
    }

    public generateCode(ast: AST): string {
        return "Query code"
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