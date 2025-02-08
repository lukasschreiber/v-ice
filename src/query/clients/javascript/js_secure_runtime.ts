import { DataTable } from "@/data/table";
import { LocalQueryRuntime, QueryFnReturnType } from "../local_query_runtime";
import SecureQueryWorker from "@/query/workers/js_secure_query_worker?worker";
import { subscribe } from "@/store/subscribe";
import { FilteredDataTable } from "@/data/filtered_table";
import { QueryWorkerInterface } from "@/query/workers/query_worker_interface";

export class JSSecureRuntime extends LocalQueryRuntime {
    private worker: QueryWorkerInterface | null = null;

    public initialize(): Promise<void> {
        this.worker = new QueryWorkerInterface(new SecureQueryWorker());
        subscribe((state) => state.sourceTable, (value) => {
            this.source = value;
            this.worker?.setRows(value.rows);
        });

        return Promise.resolve();
    }

    execute(query: string): Promise<QueryFnReturnType<FilteredDataTable>> {
        return new Promise((resolve) => {
            if (!this.worker || !this.source || this.source.columns.length === 0 || this.source.rows.length === 0 || query === "") {
                resolve({ targets: {}, edgeCounts: {} });
                return;
            }

            const table = DataTable.fromNormalizedTable(this.source);

            this.worker.runQuery(table, query).then((result) => {
                resolve(result);
            });
        });
    }
}