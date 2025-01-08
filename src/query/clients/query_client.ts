
export interface QueryClientParams {
    mode: "remote" | "local";
}

export abstract class QueryClient {
    mode: "remote" | "local";

    constructor(params: QueryClientParams) {
        this.mode = params.mode;
    }

    public abstract query(query: string): Promise<any>
}