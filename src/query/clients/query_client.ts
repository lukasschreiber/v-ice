
export interface QueryClientParams<T extends "remote" | "local" = "remote" | "local"> {
    mode: T;
}

export abstract class QueryClient {
    mode: "remote" | "local";

    constructor(params: QueryClientParams) {
        this.mode = params.mode;
    }

    public abstract execute(query: string): Promise<any>
}