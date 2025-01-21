import { QueryClient, QueryClientParams } from "@/query/clients/query_client";
import { AST } from "../builder/ast";

export interface RemoteQueryClientParams extends QueryClientParams<"remote"> {
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

    public async execute(query: string): Promise<any> {
        console.log("Remote query client querying: ", query);
        return "Remote query result";
    }

    public async generateCode(_ast: AST): Promise<string> {
        return new Promise((resolve) => {
            resolve("Remote query code");
        })
    }
}