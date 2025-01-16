import { ASTOperationNode } from "@/query/builder/ast";
import { createQueryClient } from "../query_client_build";

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
    transformers: {
        operations: {
            "equals": (astNode: ASTOperationNode) => {
                return `(${astNode.args.a} === ${astNode.args.b})`
            },
            "matches": (astNode: ASTOperationNode) => {
                return `(${astNode.args.a} === ${astNode.args.b})`
            }
        },
        primitives: {},
        nodes: {}
    }
})