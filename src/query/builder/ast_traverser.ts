import { AST, ASTNode, ASTNodeKind, ASTOperationNode, ASTSetNode, isASTNode, isOperationNode, isPrimitiveNode, isSetNode } from "./ast"
import { ASTVisitor } from "./ast_visitor"

export function traverseAST(ast: AST, visitor: ASTVisitor): void {
    visitor.visit(ast.root)
    ast.sets.forEach(set => traverseSetNode(set, visitor))
    ast.targets.forEach(target => traverseSetNode(target, visitor))
}

export function traversePartialAST<K extends ASTNodeKind, T extends ASTNode<K>>(ast: T, visitor: ASTVisitor): void {
    if (isSetNode(ast)) {
        traverseSetNode(ast, visitor)
    } else if (isOperationNode(ast)) {
        traverseOperationNode(ast, visitor)
    } else if (isPrimitiveNode(ast)) {
        visitor.visit(ast)
    }
}

function traverseSetNode(node: ASTSetNode, visitor: ASTVisitor): void {
    visitor.visit(node)

    if (node.operations) {
        node.operations.forEach(operation => traverseOperationNode(operation, visitor))
    }
}

function traverseOperationNode(node: ASTOperationNode, visitor: ASTVisitor): void {
    visitor.visit(node)
    Object.values(node.args).forEach(arg => {
        if (Array.isArray(arg)) {
            arg.forEach(node => {
                if (isASTNode(node)) {
                    visitor.visit(node)
                }
            })
        } else {
            if (isASTNode(node)) {
                visitor.visit(arg)
            }
        }
    })
}