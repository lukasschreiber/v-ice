export interface AST {
    root: ASTNode
    sets: ASTNode[]
    targets: ASTNode[]
} 

export interface ASTNode {
    id: string
    attributes: Record<string, any>
}

export type JSONSerializablePrimitive = string | number | boolean | null
export interface JSONSerializableRecord {
    [key: string]: JSONSerializablePrimitive | JSONSerializableRecord | JSONSerializablePrimitive[] | JSONSerializableRecord[]
}
export type JSONSerializable = JSONSerializablePrimitive | JSONSerializableRecord | JSONSerializablePrimitive[] | JSONSerializableRecord[]

export interface ASTPrimitive {
    value: JSONSerializable
}

export interface ASTNodeInput {
    node: string
    output?: string
}

export interface InputASTNode extends ASTNode {
    inputs: Record<string, ASTNodeInput[]>
}

export interface SubsetASTNode extends InputASTNode {
    operations: ASTOperation[]
}

export interface ASTOperation {
    operation: string
    // maybe only support positional arguments because the names are only used internally
    args: Record<string, ASTOperation | ASTPrimitive | ASTOperation[]>
}