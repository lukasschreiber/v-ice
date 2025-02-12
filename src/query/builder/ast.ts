import { AnyRegistrableBlock, BlockLinesDefinition } from "@/blocks/block_definitions"
import types, { IType } from "@/data/types"

export enum ASTNodeKind {
    Set = "Set",
    Operation = "Operation",
    Primitive = "Primitive"
}

export enum ASTArgumentKind {
    Field = "Field",
    Input = "Input",
    StatementInput = "StatementInput"
}

export type ArgumentsDefinitionFn<R, A extends { [key: string]: R }> = (astNode: ASTOperationNode) => A

export interface AST {
    root: ASTSetNode
    sets: ASTSetNode[]
    targets: ASTSetNode[]
}

export interface ASTNodeBase<K extends ASTNodeKind> {
    kind: K
}

export interface ASTEdge {
    sourceBlock: ASTSetNode,
    sourceField: string,
    targetBlock: ASTSetNode,
    targetField: string
}

export interface ASTSetNode extends ASTNodeBase<ASTNodeKind.Set> {
    inputs?: Record<string, ASTSetNodeInput[]>
    operations?: ASTOperationNode[]
    attributes: {
        id: string
        [key: string]: any
    }
}

export interface ASTOperationNode extends ASTNodeBase<ASTNodeKind.Operation> {
    operation: string
    type: string | null
    // argKinds: Record<string, ASTNodeKind>
    args: Record<string, ASTOperationNode | ASTPrimitiveNode | ASTOperationNode[]> | ArgumentsDefinitionFn<ASTOperationNode | ASTPrimitiveNode | ASTOperationNode[], Record<string, ASTOperationNode | ASTPrimitiveNode | ASTOperationNode[]>>
}

export interface ASTPrimitiveNode extends ASTNodeBase<ASTNodeKind.Primitive> {
    value: JSONSerializable
    type: string | null
}

export type ASTNode<K extends ASTNodeKind> = K extends ASTNodeKind.Set ? ASTSetNode : K extends ASTNodeKind.Operation ? ASTOperationNode : ASTPrimitiveNode

export interface ASTSetNodeInput {
    connectedSetId: string
    connectionPoint?: string
}

export type JSONSerializablePrimitive = string | number | boolean | null
export interface JSONSerializableRecord {
    [key: string]: JSONSerializablePrimitive | JSONSerializableRecord | JSONSerializablePrimitive[] | JSONSerializableRecord[]
}
export type JSONSerializable = JSONSerializablePrimitive | JSONSerializableRecord | JSONSerializablePrimitive[] | JSONSerializableRecord[]

export function isNodeWithKind<T extends ASTNodeBase<ASTNodeKind>>(node: object): node is T {
    return node.hasOwnProperty("kind")
}

export function isSetNode(node: ASTNodeBase<ASTNodeKind>): node is ASTSetNode {
    return node.kind === ASTNodeKind.Set
}

export function isOperationNode(node: ASTNodeBase<ASTNodeKind>): node is ASTOperationNode {
    return node.kind === ASTNodeKind.Operation
}

export function isPrimitiveNode(node: ASTNodeBase<ASTNodeKind>): node is ASTPrimitiveNode {
    return node.kind === ASTNodeKind.Primitive
}

export function isASTNode(node: any): node is ASTNodeBase<ASTNodeKind> {
    if (node === null || typeof node !== "object") {
        return false
    }

    return isOperationNode(node) || isSetNode(node) || isPrimitiveNode(node)
}

export function isNodeWithType<T extends ASTNodeBase<ASTNodeKind>>(node: T): node is T & { type: string | null } {
    return node.hasOwnProperty("type")
}

export function createASTNode<
    K extends ASTNodeKind,
    L extends BlockLinesDefinition,
    B extends AnyRegistrableBlock<L>,
    T extends (K extends ASTNodeKind.Set ? ASTSetNode : K extends ASTNodeKind.Operation ? ASTOperationNode : ASTPrimitiveNode)
>(
    kind: K,
    _definition: B | null,
    attributes: Omit<T, "kind" | "argKinds" | (T extends { type: string | null } ? "type" : never)> & (T extends { type: string | null } ? { type: string | IType | null } : {})
  ): T {
    const type = (attributes as any).type
    if (types.utils.isType(type)) {
        (attributes as any).type = types.utils.toString(type)
    }
   
    return {
        kind,
        ...attributes
    } as T
}