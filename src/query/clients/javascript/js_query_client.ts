import { createQueryClient } from "../query_client_build";
import { createOperationTransformer, createPrimitiveTransformer } from "../query_transformer";
import t from "@/data/types"

export const jsQueryClient = createQueryClient({
    mode: "local",
    verificator: {
        verify(_query: string): boolean {
            return true;
        }
    },
    runtime: {
        execute(_query: string): any {
            return "Local query result"
        }
    },
    transformers: [
        // Equals Operation
        createOperationTransformer({
            operation: "equals",
            args: { a: t.union(t.number, t.string, t.boolean), b: t.union(t.number, t.string, t.boolean) },
            transformer: (astNode) => `(${astNode.args.a} === ${astNode.args.b})`
        }),
        createOperationTransformer({
            operation: "equals",
            args: { a: t.list(t.wildcard), b: t.list(t.wildcard) },
            transformer: (astNode) => `(${astNode.args.a}.length === ${astNode.args.b}.length && (${astNode.args.a}).every((v, i) => v === (${astNode.args.b})[i]))`
        }),
        createOperationTransformer({
            operation: "equals",
            args: { a: t.struct(t.wildcard), b: t.struct(t.wildcard) },
            transformer: (astNode) => `Object.keys(${astNode.args.a}).length === Object.keys(${astNode.args.b}).length && Object.keys(${astNode.args.a}).every(key => (${astNode.args.b}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key]) && Object.keys(${astNode.args.b}).every(key => (${astNode.args.a}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key])`
        }),
        createOperationTransformer({
            operation: "equals",
            args: { a: t.timestamp, b: t.timestamp },
            transformer: (astNode) => `compareDates("equals", ${astNode.args.a}, ${astNode.args.b})`
        }),

        // Matches Operation
        createOperationTransformer({
            operation: "matches",
            args: { a: t.struct(t.wildcard), b: t.struct(t.wildcard) },
            transformer: (astNode) => `Object.keys(${astNode.args.a}).length >= Object.keys(${astNode.args.b}).length && Object.keys(${astNode.args.b}).every(key => (${astNode.args.a}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key])`
        }),
        createOperationTransformer({
            operation: "matches",
            args: { a: t.hierarchy(t.wildcard), b: t.hierarchy(t.wildcard) },
            transformer: (astNode) => `hierarchyEquals(${astNode.args.a}, ${astNode.args.b}, "${astNode.args.hierarchy}")`
        }),
        createOperationTransformer({
            operation: "matches",
            args: { a: t.wildcard, b: t.wildcard },
            // TODO allow the use of different operation handlers e.g. the handler for equals
            transformer: (astNode) => `(${astNode.args.a} === ${astNode.args.b})`
        }),
        
        // Equals Within Operation
        createOperationTransformer({
            operation: "equals_within",
            args: { a: t.number, b: t.number, delta: t.number },
            transformer: (astNode) => `Math.abs(${astNode.args.a} - ${astNode.args.b}) <= ${astNode.args.delta}`
        }),
        createOperationTransformer({
            operation: "equals_within",
            args: { a: t.timestamp, b: t.timestamp, delta: t.number },
            transformer: (astNode) => `(dateDiff(${astNode.args.a}, ${astNode.args.b}) <= ${astNode.args.delta}) && (dateDiff(${astNode.args.b}, ${astNode.args.a}) <= ${astNode.args.delta})`
        }),

        // Compare Numbers Operation
        createOperationTransformer({
            operation: "compare_numbers",
            args: { a: t.number, b: t.number, operator: t.string },
            transformer: (astNode) => {
                const operators = {
                    "GREATER": ">",
                    "LESS": "<",
                    "LEQ": "<=",
                    "GEQ": ">="
                }

                if (astNode.args.operator !in operators) {
                    throw new Error(`Unknown operator: ${astNode.args.operator}`)
                }

                return `(${astNode.args.a} ${operators[astNode.args.operator as keyof typeof operators]} ${astNode.args.b})`
            }
        }),
        createOperationTransformer({
            operation: "compare_numbers",
            args: { a: t.timestamp, b: t.timestamp, operator: t.string },
            transformer: (astNode) => {
                const operators = {
                    "GREATER": "after",
                    "LESS": "before",
                    "LEQ": "before_or_equals",
                    "GEQ": "after_or_equals"
                }

                if (astNode.args.operator !in operators) {
                    throw new Error(`Unknown operator: ${astNode.args.operator}`)
                }

                return `compareDates("${operators[astNode.args.operator as keyof typeof operators]}", ${astNode.args.a}, ${astNode.args.b})`
            }
        }),

        // Compare Interval Operation
        createOperationTransformer({
            operation: "compare_interval",
            args: { a: t.number, min: t.number, max: t.number },
            transformer: (astNode) => `(${astNode.args.a} > ${astNode.args.min} && ${astNode.args.a} < ${astNode.args.max})`
        }),
        createOperationTransformer({
            operation: "compare_interval",
            args: { a: t.timestamp, min: t.timestamp, max: t.timestamp },
            transformer: (astNode) => `compareDates("after", ${astNode.args.a}, ${astNode.args.min}) && compareDates("before", ${astNode.args.a}, ${astNode.args.max})`
        }),

        // Is Null Operation
        createOperationTransformer({
            operation: "is_null",
            args: { a: t.nullable(t.wildcard) },
            transformer: (astNode) => `(${astNode.args.a} === null)`
        }),

        // Primitive Transformers
        createPrimitiveTransformer({
            type: t.nullable(t.union(t.number, t.string, t.boolean, t.enum(t.wildcard), t.hierarchy(t.wildcard), t.timestamp)),
            transformer: (astNode) => `${astNode.value}`
        }),
        createPrimitiveTransformer({
            type: t.nullable(t.list(t.wildcard)),
            transformer: (astNode) => `${astNode.value === null ? "null" : `[${astNode.value.map(v => v.toString()).join(", ")}]`}`
        }),
        createPrimitiveTransformer({
            type: t.nullable(t.struct(t.wildcard)),
            transformer: (astNode) => `${astNode.value === null ? "null" : JSON.stringify(astNode.value)}`
        }),
    ]
})