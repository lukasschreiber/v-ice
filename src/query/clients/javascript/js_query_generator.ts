import { AST } from "@/query/builder/ast";
import { QueryCodeGenerator } from "../query_code_generator";

export class JSQueryGenerator extends QueryCodeGenerator {
    public generateCode(_ast: AST): string {
        return super.generateCode(_ast)
    }
}