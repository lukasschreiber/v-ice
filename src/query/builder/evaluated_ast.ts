import { ASTOperationNode, ASTSetNode, AST, ASTNodeBase, ASTNodeKind, isPrimitiveNode } from "./ast"

export interface eAST {
    root: eASTSetNode
    sets: eASTSetNode[]
    targets: eASTSetNode[]
}

export interface eASTSetNode extends ASTSetNode {
    evaluatedOperations?: string[]
}

export interface eASTOperationNode extends ASTOperationNode {
    evaluatedArgs: Record<string, string | string[] | undefined>
}

export function convertToEvaluatedAST(ast: AST): eAST {
    return {
        root: convertToEvaluatedSetNode(ast.root),
        sets: ast.sets.map(convertToEvaluatedSetNode),
        targets: ast.targets.map(convertToEvaluatedSetNode)
    }
}

export function convertToEvaluatedSetNode(node: ASTSetNode): eASTSetNode {
    return {
        ...node,
        evaluatedOperations: undefined,
        operations: node.operations?.map(convertToEvaluatedOperationNode)
    }
}

export function convertToEvaluatedOperationNode(node: ASTOperationNode): eASTOperationNode {
    const args = typeof node.args === "function" ? node.args(node) : node.args
    return {
        ...node,
        evaluatedArgs: Object.fromEntries(Object.entries(args).map(([key, value]) => {
            if (Array.isArray(value)) {
                return [key, []]
            } else {
                return [key, undefined]
            }
        })),
        args: Object.fromEntries(Object.entries(args).map(([key, value]) => {
            if (Array.isArray(value)) {
                return [key, value.map(convertToEvaluatedOperationNode)]
            } else if (isPrimitiveNode(value)) {
                return [key, value]
            } else {
                return [key, convertToEvaluatedOperationNode(value)]
            }
        }))
    }
}

export function isEvaluatedOperationNode(node: ASTNodeBase<ASTNodeKind>): node is eASTOperationNode {
    return node.kind === ASTNodeKind.Operation && node.hasOwnProperty("evaluatedArgs")
}

export function isEvaluatedSetNode(node: ASTNodeBase<ASTNodeKind>): node is eASTSetNode {
    return node.kind === ASTNodeKind.Set && node.hasOwnProperty("evaluatedOperations")
}