import { IType } from "@/data/types"

export interface QueryTree {
    root: QueryNode
    sets: QueryNode[]
    targets: QueryNode[]
} 

export interface QueryNode {
    id: string
    attributes: Record<string, any>
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
    name: string
    // maybe only support positional arguments because the names are only used internally
    args: Record<string, IType>
}