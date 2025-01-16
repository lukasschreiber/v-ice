import { ASTNode, ASTNodeKind } from "./ast";

export interface ASTVisitor {
    visit<K extends ASTNodeKind, T extends ASTNode<K>>(node: T): void
}