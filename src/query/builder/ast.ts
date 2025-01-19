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
    argKinds: Record<string, ASTNodeKind>
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
    L extends BlockLinesDefinition,
    B extends AnyRegistrableBlock<L>,
    T extends (K extends ASTNodeKind.Set ? ASTSetNode : K extends ASTNodeKind.Operation ? ASTOperationNode : ASTPrimitiveNode)
>(
    kind: K,
    definition: B | null,
    attributes: Omit<T, "kind" | "argKinds" | (T extends { type: string | null } ? "type" : never)> & (T extends { type: string | null } ? { type: string | IType | null } : {})
  ): T {
    const type = (attributes as any).type
    if (types.utils.isType(type)) {
        (attributes as any).type = types.utils.toString(type)
    }

    if (kind === ASTNodeKind.Operation && definition) {
        const argKinds: Record<string, ASTArgumentKind> = {}
        for (const line of definition.lines) {
            for (const arg of line.args) {
                if (arg.type === "input_statement") {
                    argKinds[arg.name] = ASTArgumentKind.StatementInput
                } else if (arg.type.startsWith("field")) {
                    argKinds[arg.name] = ASTArgumentKind.Field
                } else if (arg.type.startsWith("input_")) {
                    argKinds[arg.name] = ASTArgumentKind.Input
                }
            }
        }

        return {
            kind,
            argKinds,
            ...attributes
        } as unknown as T
    }
   
    return {
        kind,
        ...attributes
    } as T
}