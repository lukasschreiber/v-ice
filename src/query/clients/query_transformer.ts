import { ASTNodeKind, ASTOperationNode, ASTPrimitiveNode, ASTSetNode } from "../builder/ast"
import { IType, ValueOf } from "@/data/types"


export interface IQueryTransformerDefinition {
    kind: ASTNodeKind
    transformer: QueryTransformerForNode
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

export type QueryTransformerDefinition = OperationNodeQueryTransformerDefinition<any> | PrimitiveNodeQueryTransformerDefinition<any> | SetNodeQueryTransformerDefinition

export type QueryTransformerForOperationNode<A extends {[key: string]: IType}> = (astNode: ASTOperationNode & {
    args: { [K in keyof A]: string }
}) => string
export type QueryTransformerForPrimitiveNode<T extends IType> = (astNode: ASTPrimitiveNode & {value: ValueOf<T>}) => string
export type QueryTransformerForSetNode = (astNode: ASTSetNode) => string
export type QueryTransformerForNode = (astNode: any) => string

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