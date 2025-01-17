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

export interface PrimitiveNodeQueryTransformerDefinition extends IQueryTransformerDefinition {
    kind: ASTNodeKind.Primitive
    type: IType
    transformer: QueryTransformerForPrimitiveNode
}

export interface SetNodeQueryTransformerDefinition extends IQueryTransformerDefinition {
    kind: ASTNodeKind.Set
    transformer: QueryTransformerForSetNode
}

export type QueryTransformerDefinition = OperationNodeQueryTransformerDefinition<any> | PrimitiveNodeQueryTransformerDefinition | SetNodeQueryTransformerDefinition

export type QueryTransformerForOperationNode<A extends {[key: string]: IType}> = (astNode: ASTOperationNode & {
    args: { [K in keyof A]: ValueOf<A[K]> }
}) => string
export type QueryTransformerForPrimitiveNode = (astNode: ASTPrimitiveNode) => string
export type QueryTransformerForSetNode = (astNode: ASTSetNode) => string
export type QueryTransformerForNode = (astNode: any) => string

export function createOperationTransformer<A extends {[key: string]: IType}>(
    definition: Omit<OperationNodeQueryTransformerDefinition<A>, "kind">
): OperationNodeQueryTransformerDefinition<A> {
    return { ...definition, kind: ASTNodeKind.Operation } as OperationNodeQueryTransformerDefinition<A>
}