import { QueryClient, QueryClientParams } from "@/query/clients/query_client";

export interface LocalQueryClientParams extends QueryClientParams {
    mode: "local";
}

export class LocalQueryClient extends QueryClient {
    constructor(params: LocalQueryClientParams) {
        super(params);
    }

    public async query(query: string): Promise<any> {
        console.log("Local query client querying: ", query);
        return "Local query result";
    }
}