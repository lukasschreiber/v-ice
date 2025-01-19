import { AST } from "@/query/builder/ast";
import { QueryCodeGenerator } from "../query_code_generator";

export class JSQueryGenerator extends QueryCodeGenerator {
    public generateCode(ast: AST): string {
        return "JavaScript query code"
    }
}