import { ASTEdge, ASTNodeKind, ASTOperationNode, ASTPrimitiveNode, ASTSetNode } from "../builder/ast"
import { IType, ValueOf } from "@/data/types"

export enum TransformerKind {
    QueryFunction = "query_function",
}

export interface IQueryTransformerDefinition {
    kind: ASTNodeKind | TransformerKind
    transformer: QueryTransformerForNode | QueryFunctionTransformer
}

export interface OperationNodeQueryTransformerDefinition<A extends {[key: string]: IType}> extends IQueryTransformerDefinition {
    kind: ASTNodeKind.Operation
    operation: string,
    args: A
    transformer: QueryTransformerForOperationNode<A>
}

export interface PrimitiveNodeQueryTransformerDefinition<T extends IType> extends IQueryTransformerDefinition {
    kind: ASTNodeKind.Primitive
    type: T
    transformer: QueryTransformerForPrimitiveNode<T>
}

export interface SetNodeQueryTransformerDefinition extends IQueryTransformerDefinition {
    kind: ASTNodeKind.Set
    blockName: string
    transformer: QueryTransformerForSetNode
}

export interface QueryFunctionTransformerDefinition extends IQueryTransformerDefinition {
    kind: TransformerKind.QueryFunction
    transformer: QueryFunctionTransformer
}

export type QueryTransformerDefinition = OperationNodeQueryTransformerDefinition<any> | PrimitiveNodeQueryTransformerDefinition<any> | SetNodeQueryTransformerDefinition | QueryFunctionTransformerDefinition

export type QueryTransformerForOperationNode<A extends {[key: string]: IType}> = (astNode: ASTOperationNode & {
    args: { [K in keyof A]: string }
}) => string
export type QueryTransformerForPrimitiveNode<T extends IType> = (astNode: ASTPrimitiveNode & {value: ValueOf<T>}) => string
export type QueryTransformerForSetNode = (astNode: ASTSetNode) => string
export type QueryTransformerForNode = (astNode: any) => string
export type QueryFunctionTransformer = (source: ASTSetNode, sets: ASTSetNode[], targets: ASTSetNode[], edges: Map<string, ASTEdge>) => string

export function createOperationTransformer<A extends {[key: string]: IType}>(
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

export function createQueryFunctionTransformer(
    definition: Omit<QueryFunctionTransformerDefinition, "kind">
): QueryFunctionTransformerDefinition {
    return { ...definition, kind: TransformerKind.QueryFunction } as QueryFunctionTransformerDefinition
}