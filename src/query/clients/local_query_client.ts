import { QueryClient, QueryClientParams } from "@/query/clients/query_client";
import { AST } from "../builder/ast";
import { LocalQueryVerificator } from "./local_query_verificator";
import { LocalQueryRuntime } from "./local_query_runtime";
import { QueryTransformerDefinition } from "./query_transformer";

export interface LocalQueryClientParams extends QueryClientParams<"local"> {
    mode: "local";
    verificator: LocalQueryVerificator;
    runtime: LocalQueryRuntime;
    transformers: QueryTransformerDefinition[];
}

export class LocalQueryClient extends QueryClient {
    protected verificator: LocalQueryVerificator;
    protected runtime: LocalQueryRuntime;

    constructor(params: LocalQueryClientParams) {
        super(params);
        this.verificator = params.verificator;
        this.runtime = params.runtime;
    }

    public async execute(query: string): Promise<any> {
        return this.runtime.execute(query);
    }

    public verify(query: string): boolean {
        return this.verificator.verify(query);
    }

    public astToQueryCode(ast: AST): string {
        console.log("Local query client converting AST to query code: ", ast);
        return "Local query code"
    }
}