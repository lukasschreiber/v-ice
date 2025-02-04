import { DataTable, DataRow } from "@/data/table";
import { LocalQueryRuntime, QueryFnReturnType } from "../local_query_runtime";
import QueryWorker from "@/workers/js_query_worker?worker";
import { subscribe } from "@/store/subscribe";

export class JSWorkerRuntime extends LocalQueryRuntime {
    private worker: Worker | null = null;

    public initialize(): Promise<void> {
        this.worker = new QueryWorker();
        subscribe((state) => state.sourceTable, (value) => {
            this.source = value;
            this.worker?.postMessage({ action: "set_rows", rows: this.source.rows });
        });

        return Promise.resolve();
    }

    execute(query: string): Promise<QueryFnReturnType<DataTable>> {
        return new Promise((resolve) => {
            if (!this.worker || !this.source || this.source.columns.length === 0 || this.source.rows.length === 0 || query === "") {
                resolve({ targets: {}, edgeCounts: {} });
                return;
            }

            this.worker.postMessage({ action: "run_query", query });

            this.worker.onmessage = (event) => {
                const result: QueryFnReturnType<DataRow[]> = event.data;
                const tables: Record<string, DataTable> = {};

                for (const [id, rows] of Object.entries(result.targets)) {
                    // We should not actually copy the data, we could just pass the indices
                    tables[id] = DataTable.fromRows(rows, this.source!.columns.map(it => it.type), this.source!.columns.map(it => it.name));
                }

                resolve({ targets: tables, edgeCounts: result.edgeCounts });
            };

            this.worker.onerror = (error) => {
                console.warn(error);
                resolve({ targets: {}, edgeCounts: {} });
            };
        });
    }
}