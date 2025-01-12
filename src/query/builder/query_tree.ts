export interface QueryTree {
    root: QueryNode
    sets: QueryNode[]
    targets: QueryNode[]
} 

export interface QueryNode {
    id: string
    attributes: Record<string, any>
}

export type JSONSerializablePrimitive = string | number | boolean | null
export interface JSONSerializableRecord {
    [key: string]: JSONSerializablePrimitive | JSONSerializableRecord | JSONSerializablePrimitive[] | JSONSerializableRecord[]
}
export type JSONSerializable = JSONSerializablePrimitive | JSONSerializableRecord | JSONSerializablePrimitive[] | JSONSerializableRecord[]

export interface QueryPrimitive {
    value: JSONSerializable
}

export interface QueryNodeInput {
    node: string
    output?: string
}

export interface InputQueryNode extends QueryNode {
    inputs: Record<string, QueryNodeInput[]>
}

export interface SubsetQueryNode extends InputQueryNode {
    operations: QueryOperation[]
}

export interface QueryOperation {
    operation: string
    // maybe only support positional arguments because the names are only used internally
    args: Record<string, QueryOperation | QueryPrimitive | QueryOperation[]>
}