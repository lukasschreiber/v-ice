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
    const args = typeof node.args === 'function' ? node.args(node) : node.args
    Object.values(args).forEach(arg => {
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

export function traverseASTReverse(ast: AST, visitor: ASTVisitor): void {
    ast.sets.forEach(set => traverseSetNodeReverse(set, visitor))
    ast.targets.forEach(target => traverseSetNodeReverse(target, visitor))
    visitor.visit(ast.root)
}

function traverseSetNodeReverse(node: ASTSetNode, visitor: ASTVisitor): void {
    if (node.operations) {
        node.operations.forEach(operation => traverseOperationNodeReverse(operation, visitor))
    }
    visitor.visit(node)
}

function traverseOperationNodeReverse(node: ASTOperationNode, visitor: ASTVisitor): void {
    const args = typeof node.args === 'function' ? node.args(node) : node.args
    Object.values(args).forEach(arg => {
        if (Array.isArray(arg)) {
            arg.forEach(subNode => {
                if (isASTNode(subNode)) {
                    traverseASTReversePartial(subNode, visitor)
                }
            })
        } else {
            if (isASTNode(arg)) {
                traverseASTReversePartial(arg, visitor)
            }
        }
    })
    visitor.visit(node)
}

function traverseASTReversePartial<K extends ASTNodeKind, T extends ASTNode<K>>(ast: T, visitor: ASTVisitor): void {
    if (isSetNode(ast)) {
        traverseSetNodeReverse(ast, visitor)
    } else if (isOperationNode(ast)) {
        traverseOperationNodeReverse(ast, visitor)
    } else if (isPrimitiveNode(ast)) {
        visitor.visit(ast)
    }
}