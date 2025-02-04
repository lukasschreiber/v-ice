import { DataTable } from "@/data/table";
import { QueryFnReturnType } from "./local_query_runtime";
import { AST } from "../builder/ast";

export interface QueryClientParams<T extends "remote" | "local" = "remote" | "local"> {
    mode: T;
}

export abstract class QueryClient {
    mode: "remote" | "local";

    constructor(params: QueryClientParams) {
        this.mode = params.mode;
    }

    public abstract execute(query: string): Promise<QueryFnReturnType<DataTable>>

    public abstract generateCode(ast: AST): Promise<string>
}