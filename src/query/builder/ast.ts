import types, { IType } from "@/data/types"

export enum ASTNodeKind {
    Set = "Set",
    Operation = "Operation",
    Primitive = "Primitive"
}

export interface AST {
    root: ASTSetNode
    sets: ASTSetNode[]
    targets: ASTSetNode[]
}

export interface ASTNode<K extends ASTNodeKind> {
    kind: K
}

export interface ASTSetNode extends ASTNode<ASTNodeKind.Set> {
    inputs?: Record<string, ASTSetNodeInput[]>
    operations?: ASTOperationNode[]
    attributes: {
        id: string
        [key: string]: any
    }
}

export interface ASTOperationNode extends ASTNode<ASTNodeKind.Operation> {
    operation: string
    type: string | null
    // maybe only support positional arguments because the names are only used internally
    args: Record<string, ASTOperationNode | ASTPrimitiveNode | ASTOperationNode[]>
}

export interface ASTPrimitiveNode extends ASTNode<ASTNodeKind.Primitive> {
    value: JSONSerializable
    type: string | null
}

export interface ASTSetNodeInput {
    connectedSetId: string
    connectionPoint?: string
}

export type JSONSerializablePrimitive = string | number | boolean | null
export interface JSONSerializableRecord {
    [key: string]: JSONSerializablePrimitive | JSONSerializableRecord | JSONSerializablePrimitive[] | JSONSerializableRecord[]
}
export type JSONSerializable = JSONSerializablePrimitive | JSONSerializableRecord | JSONSerializablePrimitive[] | JSONSerializableRecord[]

export function isNodeWithKind<T extends ASTNode<ASTNodeKind>>(node: object): node is T {
    return node.hasOwnProperty("kind")
}

export function isSetNode(node: ASTNode<ASTNodeKind>): node is ASTSetNode {
    return node.kind === ASTNodeKind.Set
}

export function isOperationNode(node: ASTNode<ASTNodeKind>): node is ASTOperationNode {
    return node.kind === ASTNodeKind.Operation
}

export function isPrimitiveNode(node: ASTNode<ASTNodeKind>): node is ASTPrimitiveNode {
    return node.kind === ASTNodeKind.Primitive
}

export function isASTNode(node: any): node is ASTNode<ASTNodeKind> {
    if (node === null || typeof node !== "object") {
        return false
    }

    return isOperationNode(node) || isSetNode(node) || isPrimitiveNode(node)
}

export function isNodeWithType<T extends ASTNode<ASTNodeKind>>(node: T): node is T & { type: string | null } {
    return node.hasOwnProperty("type")
}

export function createASTNode<
    K extends ASTNodeKind,
    T extends (K extends ASTNodeKind.Set ? ASTSetNode : K extends ASTNodeKind.Operation ? ASTOperationNode : ASTPrimitiveNode)
>(
    kind: K,
    attributes: Omit<T, "kind" | (T extends { type: string | null } ? "type" : never)> & (T extends { type: string | null } ? { type: string | IType | null } : {})
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