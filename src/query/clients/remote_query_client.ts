import { QueryClient, QueryClientParams } from "@/query/clients/query_client";

export interface RemoteQueryClientParams extends QueryClientParams {
    mode: "remote";
    endpoint: string;
}

export class RemoteQueryClient extends QueryClient {
    protected endpoint: string | null = null;

    constructor(params: RemoteQueryClientParams) {
        super(params);

        if (params.endpoint === "") {
            throw new Error("Endpoint cannot be empty");
        } else if (!params.endpoint.match(/^(http|https):\/\//)) {
            throw new Error("Endpoint must start with http:// or https://");
        }

        this.endpoint = params.endpoint;
    }

    public async query(query: string): Promise<any> {
        console.log("Remote query client querying: ", query);
        return "Remote query result";
    }
}