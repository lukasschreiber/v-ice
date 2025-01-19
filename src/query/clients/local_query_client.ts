import { QueryClient, QueryClientParams } from "@/query/clients/query_client";
import { AST } from "../builder/ast";
import { LocalQueryVerificator } from "./local_query_verificator";
import { LocalQueryRuntime } from "./local_query_runtime";
import { QueryCodeGenerator } from "./query_code_generator";


export interface LocalQueryClientParams extends QueryClientParams<"local"> {
    mode: "local";
    verificator: LocalQueryVerificator;
    runtime: LocalQueryRuntime;
    generator: QueryCodeGenerator;
}

export class LocalQueryClient extends QueryClient {
    protected verificator: LocalQueryVerificator;
    protected runtime: LocalQueryRuntime;
    protected generator: QueryCodeGenerator;

    constructor(params: LocalQueryClientParams) {
        super(params);
        this.verificator = params.verificator;
        this.runtime = params.runtime;
        this.generator = params.generator;
    }

    public async execute(query: string): Promise<any> {
        return this.runtime.execute(query);
    }

    public verify(query: string): boolean {
        return this.verificator.verify(query);
    }

    public generateCode(ast: AST): string {
        return this.generator.generateCode(ast);
    }

}

    