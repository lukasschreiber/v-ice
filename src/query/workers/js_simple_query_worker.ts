import { DataRow, DataTable } from "@/data/table";
import { QueryFnReturnType } from "@/query/clients/local_query_runtime";
import { BaseWorker } from "./js_base_query_worker";

class SimpleQueryWorker extends BaseWorker {
    protected runQuery(query: string) {
        if (!this.rows) {
            console.warn("Rows are not initialized.");
            self.postMessage({ targets: {}, edgeCounts: {} });
            return;
        }

        try {
            const queryFunction = new Function(
                "init",
                `${query.replace(/`/g, "\\`")}; return query_root(init);`
            );

            const result: QueryFnReturnType<DataRow[]> = queryFunction(this.rows);

            const output: QueryFnReturnType<number[]> = {
                targets: Object.fromEntries(
                    Object.entries(result.targets).map(([key, rows]) => [
                        key,
                        rows.map(row => row[DataTable.indexColumnName_] as number),
                    ])
                ),
                edgeCounts: result.edgeCounts,
            };

            self.postMessage(output);
        } catch (error) {
            console.warn("Query execution error:", error);
            self.postMessage({ targets: {}, edgeCounts: {} });
        }
    }
}

new SimpleQueryWorker();
