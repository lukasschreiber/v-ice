import { DataTable, DataRow } from "@/data/table";
import { LocalQueryRuntime, QueryFnReturnType } from "../local_query_runtime";
import QueryWorker from "@/workers/js_query_worker?worker";

export class JSWorkerRuntime extends LocalQueryRuntime {
    execute(query: string, source: DataTable): Promise<QueryFnReturnType<DataTable>> {
        return new Promise((resolve) => {
            if (source.getColumnCount() === 0 || source.getRowCount() === 0 || query === "") {
                resolve({ targets: {}, edgeCounts: {} });
                return;
            }

            const worker = new QueryWorker();

            worker.postMessage({ rows: source.getRows(), query });

            worker.onmessage = (event) => {
                const result = event.data;
                const tables: Record<string, DataTable> = {};

                for (const [id, rows] of Object.entries(result.targets)) {
                    tables[id] = DataTable.fromRows(rows as DataRow[], source.getColumnTypes(), source.getColumnNames());
                }

                worker.terminate();
                resolve({ targets: tables, edgeCounts: result.edgeCounts });
            };

            worker.onerror = (error) => {
                console.warn(error);
                worker.terminate();
                resolve({ targets: {}, edgeCounts: {} });
            };
        });
    }
}