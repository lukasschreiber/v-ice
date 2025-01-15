import { LocalQueryClient, LocalQueryClientParams } from "./local_query_client";
import { RemoteQueryClient, RemoteQueryClientParams } from "./remote_query_client";

export function createQueryClient<T extends LocalQueryClientParams | RemoteQueryClientParams>(params: T): T extends LocalQueryClientParams ? LocalQueryClient : RemoteQueryClient {
    if (params.mode === "local") {
        return new LocalQueryClient(params) as T extends LocalQueryClientParams ? LocalQueryClient : RemoteQueryClient;
    } else if (params.mode === "remote") {
        return new RemoteQueryClient(params) as T extends LocalQueryClientParams ? LocalQueryClient : RemoteQueryClient;
    } else {
        throw new Error("Invalid mode");
    }
}