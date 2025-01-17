import { createQueryClient } from "../query_client_build";
import { createOperationTransformer } from "../query_transformer";
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
        createOperationTransformer({
            operation: "equals",
            args: {
                a: t.union(t.number, t.string, t.boolean),
                b: t.union(t.number, t.string, t.boolean),
            },
            transformer: (astNode) => {
                return `(${astNode.args.a} === ${astNode.args.b})`
            }
        }),
        createOperationTransformer({
            operation: "equals",
            args: {
                a: t.list(t.wildcard),
                b: t.list(t.wildcard),
            },
            transformer: (astNode) => {
                return `(${astNode.args.a}.length === ${astNode.args.b}.length && (${astNode.args.a}).every((v, i) => v === (${astNode.args.b})[i]))`
            }
        }),
        createOperationTransformer({
            operation: "equals",
            args: {
                a: t.struct(t.wildcard),
                b: t.struct(t.wildcard),
            },
            transformer: (astNode) => {
                return `Object.keys(${astNode.args.a}).length === Object.keys(${astNode.args.b}).length && Object.keys(${astNode.args.a}).every(key => (${astNode.args.b}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key]) && Object.keys(${astNode.args.b}).every(key => (${astNode.args.a}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key])`
            }
        }),
        createOperationTransformer({
            operation: "equals",
            args: {
                a: t.timestamp,
                b: t.timestamp,
            },
            transformer: (astNode) => {
                return `compareDates("equals", ${astNode.args.a}, ${astNode.args.b})`
            }
        }),
        createOperationTransformer({
            operation: "add",
            args: {
                a: t.number,
                b: t.number,
            },
            transformer: (astNode) => {
                return `(${astNode.args.a} + ${astNode.args.b})`
            }
        }),
    ]
})