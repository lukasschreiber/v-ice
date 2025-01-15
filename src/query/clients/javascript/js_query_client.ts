import { createQueryClient } from "../query_client_build";
import { ASTOperation } from "@/query/builder/ast";

export const jsQueryClient = createQueryClient({
    mode: "local",
    verificator: {
        verify(query: string): boolean {
            return true;
        }
    },
    runtime: {
        execute(query: string): any {
            return "Local query result"
        }
    },
    transformers: {
        operations: {
            "equals": (astNode: ASTOperation) => {
                return `(${astNode.args.a} === ${astNode.args.b})`
            },
            "matches": (astNode: ASTOperation) => {
                return `(${astNode.args.a} === ${astNode.args.b})`
            }
        },
        primitives: {},
        nodes: {}
    }
})