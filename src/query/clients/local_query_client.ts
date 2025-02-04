import { QueryClient, QueryClientParams } from "@/query/clients/query_client";
import { AST } from "../builder/ast";
import { LocalQueryRuntime, QueryFnReturnType } from "./local_query_runtime";
import { QueryCodeGenerator } from "./query_code_generator";
import { DataTable } from "@/data/table";


export interface LocalQueryClientParams extends QueryClientParams<"local"> {
    mode: "local";
    runtime: LocalQueryRuntime;
    generator: QueryCodeGenerator;
}

export class LocalQueryClient extends QueryClient {
    protected runtime: LocalQueryRuntime;
    protected generator: QueryCodeGenerator;
    protected initialized: boolean = false;

    constructor(params: LocalQueryClientParams) {
        super(params);
        this.runtime = params.runtime;
        this.generator = params.generator;

        this.runtime.initialize().then(() => {
            this.initialized = true;
        });
    }

    public async execute(query: string): Promise<QueryFnReturnType<DataTable>> {
        if (!this.initialized) {
            await this.runtime.initialize();
            this.initialized = true;
        }

        return this.runtime.execute(query);
    }

    public dispose() {
        this.runtime.dispose();
    }

    public verifyCode(query: string): Promise<boolean> {
        return this.generator.verifyCode(query);
    }

    public generateCode(ast: AST): Promise<string> {
        return this.generator.generateCode(ast);
    }

    public formatCode(code: string): Promise<string> {
        return this.generator.formatCode(code);
    }

    public optimizeCode(code: string): Promise<string> {
        return this.generator.optimizeCode(code);
    }
}

    