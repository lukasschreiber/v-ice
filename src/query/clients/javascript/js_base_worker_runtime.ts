import { DataTable } from "@/data/table";
import { LocalQueryRuntime, QueryFnReturnType } from "../local_query_runtime";
import { subscribe } from "@/store/subscribe";
import { FilteredDataTable } from "@/data/filtered_table";
import { QueryWorkerInterface } from "@/query/workers/query_worker_interface";
import { debug } from "@/utils/logger";

export class JSBaseWorkerRuntime extends LocalQueryRuntime {
    private worker: QueryWorkerInterface;

    constructor(worker: Worker) {
        super();
        this.worker = new QueryWorkerInterface(worker);
    }

    public initialize(): Promise<void> {
        subscribe((state) => state.sourceTable, (value) => {
            this.source = value;
            debug("Updated source table in", this.constructor.name).addVariable("Number of Rows", value.rows.length).addVariable("Structure", value.columns).log();
            this.worker.setRows(value.rows);
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