import { expect, describe, it, vitest } from "vitest";

import { traversePartialAST } from "./ast_traverser";
import { ASTNodeKind, createASTNode } from "./ast";

describe("AST Traverser", () => {
    it("should traverse AST", () => {
        const ast = createASTNode(ASTNodeKind.Set, {
            attributes: {
                id: "test"
            },
            operations: [
                createASTNode(ASTNodeKind.Operation, {
                    operation: "test",
                    type: "test",
                    args: {
                        arg1: createASTNode(ASTNodeKind.Primitive, { value: "test", type: "test" }),
                        arg2: createASTNode(ASTNodeKind.Primitive, { value: "test", type: "test" })
                    }
                }),
                createASTNode(ASTNodeKind.Operation, {
                    operation: "test",
                    type: "test",
                    args: {
                        arg1: createASTNode(ASTNodeKind.Primitive, { value: "test", type: "test" }),
                        arg2: createASTNode(ASTNodeKind.Primitive, { value: "test", type: "test" })
                    }
                })
            ]
        })

        const visitor = {
            visit: vitest.fn()
        }

        traversePartialAST(ast, visitor)

        expect(visitor.visit).toHaveBeenCalledTimes(5)
    })
})