import { ASTBuilder } from "./ast_builder";

let builderInstance: ASTBuilder | null = null;

export function getASTBuilderInstance(): ASTBuilder {
    if (!builderInstance) {
        builderInstance = new ASTBuilder();
    }
    return builderInstance;
}