
export interface QueryClientParams {
    mode: "remote" | "local";
}

export interface LocalQueryClientParams extends QueryClientParams {
    mode: "local";
}

export interface RemoteQueryClientParams extends QueryClientParams {
    mode: "remote";
    endpoint: string;
}

export abstract class QueryClient {
    mode: "remote" | "local";

    constructor(params: RemoteQueryClientParams | LocalQueryClientParams) {
        this.mode = params.mode;
    }

    public abstract query(query: string): Promise<any>
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