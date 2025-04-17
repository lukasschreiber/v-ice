import { ASTEdge, ASTNode, ASTNodeKind, ASTOperationNode, ASTPrimitiveNode, ASTSetNode, ArgumentsDefinitionFn } from "../builder/ast"
import { INullableType, IType, ValueOf } from "@/data/types"

/**
 * The kind of a transformer, currently only used for special transformers
 * but could be extended to include other kinds of transformers in the future.
 * This is commonly used together with `ASTNodeKind`
 */
export enum TransformerKind {
    QueryFunction = "query_function",
}

/**
 * A definition for a query transformer, which is a function that takes an AST node
 * and returns a string representation of the query that should be
 * 
 * @param kind The kind of the AST node that this transformer should be applied to
 * @param transformer The transformer function that should be applied to the AST node
 */
export interface IQueryTransformerDefinition {
    kind: ASTNodeKind | TransformerKind
    transformer: TransformerFn
}


export interface OperationNodeQueryTransformerDefinition<A extends { [key: string]: IType }> extends IQueryTransformerDefinition {
    kind: ASTNodeKind.Operation
    operation: string,
    complexity: number,
    args: A | ArgumentsDefinitionFn<IType, A>
    transformer: OperationTransformerFn<A>
}

export interface PrimitiveNodeQueryTransformerDefinition<T extends IType> extends IQueryTransformerDefinition {
    kind: ASTNodeKind.Primitive
    type: T
    transformer: PrimitiveTransformerFn<T>
}

export interface SetNodeQueryTransformerDefinition extends IQueryTransformerDefinition {
    kind: ASTNodeKind.Set
    blockName: string
    transformer: SetTransformerFn
}

export interface QueryFunctionTransformerDefinition extends IQueryTransformerDefinition {
    kind: TransformerKind.QueryFunction
    transformer: QueryTransformerFn
}

export interface QueryTransformerBaseUtils {
    getName: (id: string) => string,
    createName: (id: string, name: string) => string,
} 

export interface QueryTransformerUtils<NodeKind extends ASTNodeKind> extends QueryTransformerBaseUtils {
    useAlias: AliasFn<NodeKind>,
}

export interface OperationNodeQueryTransformerUtils<A extends { [key: string]: IType }> extends QueryTransformerUtils<ASTNodeKind.Operation> {
    definition: {
        args: A
    }
}

export type QueryTransformerDefinition = OperationNodeQueryTransformerDefinition<any> | PrimitiveNodeQueryTransformerDefinition<any> | SetNodeQueryTransformerDefinition | QueryFunctionTransformerDefinition

export type QueryTransformerFn = (source: ASTSetNode, sets: ASTSetNode[], targets: ASTSetNode[], edges: Map<string, ASTEdge>, utils: QueryTransformerBaseUtils) => string

export type NodeTransformerFn<NodeKind extends ASTNodeKind, Node extends ASTNode<NodeKind>, Utils extends QueryTransformerUtils<NodeKind> = QueryTransformerUtils<NodeKind>> = (astNode: Node, utils: Utils) => string
export type OperationTransformerFn<A extends { [key: string]: IType }> = NodeTransformerFn<ASTNodeKind.Operation, ASTOperationNode & { args: { [K in keyof A]: A[K] extends INullableType<IType> ? string | null : string } }, OperationNodeQueryTransformerUtils<A>>
export type PrimitiveTransformerFn<T extends IType> = NodeTransformerFn<ASTNodeKind.Primitive, ASTPrimitiveNode & { value: ValueOf<T> }>
export type SetTransformerFn = NodeTransformerFn<ASTNodeKind.Set, ASTSetNode>

export type TransformerFn = QueryTransformerFn | OperationTransformerFn<any> | PrimitiveTransformerFn<any> | SetTransformerFn

export type SetAliasFn = (astNode: ASTSetNode) => string
export type OperationAliasFn = (astNode: ASTOperationNode, operation: string, args: { [key: string]: IType }) => string
export type PrimitiveAliasFn = (astNode: ASTPrimitiveNode, operation: string, type: IType) => string

export type AliasFn<NodeKind extends ASTNodeKind> = NodeKind extends ASTNodeKind.Set ? SetAliasFn : NodeKind extends ASTNodeKind.Operation ? OperationAliasFn : PrimitiveAliasFn

export function createOperationTransformer<A extends { [key: string]: IType }>(
    definition: Omit<OperationNodeQueryTransformerDefinition<A>, "kind">
): OperationNodeQueryTransformerDefinition<A> {
    return { ...definition, kind: ASTNodeKind.Operation } as OperationNodeQueryTransformerDefinition<A>
}

export function createPrimitiveTransformer<T extends IType>(
    definition: Omit<PrimitiveNodeQueryTransformerDefinition<T>, "kind">
): PrimitiveNodeQueryTransformerDefinition<T> {
    return { ...definition, kind: ASTNodeKind.Primitive } as PrimitiveNodeQueryTransformerDefinition<T>
}

export function createSubsetTransformer(
    definition: Omit<SetNodeQueryTransformerDefinition, "kind" | "blockName">
): SetNodeQueryTransformerDefinition {
    return { ...definition, kind: ASTNodeKind.Set, blockName: "subset_node" } as SetNodeQueryTransformerDefinition
}

export function createSetArithmeticTransformer(
    definition: Omit<SetNodeQueryTransformerDefinition, "kind" | "blockName">
): SetNodeQueryTransformerDefinition {
    return { ...definition, kind: ASTNodeKind.Set, blockName: "set_arithmetic_node" } as SetNodeQueryTransformerDefinition
}

export function createQueryFunctionTransformer(
    definition: Omit<QueryFunctionTransformerDefinition, "kind">
): QueryFunctionTransformerDefinition {
    return { ...definition, kind: TransformerKind.QueryFunction } as QueryFunctionTransformerDefinition
}