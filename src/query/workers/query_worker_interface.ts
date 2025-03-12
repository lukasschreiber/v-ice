import { FilteredDataTable } from "@/data/filtered_table";
import { DataRow, DataTable } from "@/data/table";

export type QueryFnReturnType<T> = {targets: Record<string, T>, edgeCounts: Record<string, number>}

export enum QueryWorkerAction {
    SetRows = "set_rows",
    RunQuery = "run_query"
}

export class QueryWorkerInterface {
    private worker: Worker;

    constructor(worker: Worker) {
        this.worker = worker;
    }
    
    setRows(rows: DataRow[]) {
        this.worker.postMessage({ action: QueryWorkerAction.SetRows, rows });
    }

    runQuery(source: DataTable, query: string): Promise<QueryFnReturnType<FilteredDataTable>> {
        return new Promise((resolve) => {
            this.worker.postMessage({ action: QueryWorkerAction.RunQuery, query });

            this.worker.onmessage = (event) => {
                const result: QueryFnReturnType<number[]> = event.data;
                const tables: Record<string, FilteredDataTable> = {};

                for (const [id, indices] of Object.entries(result.targets)) {
                    // We should not actually copy the data, we could just pass the indices
                    tables[id] = source.createFilteredView(indices);
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