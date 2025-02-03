import { DataTable, DataRow } from "@/data/table";
import { LocalQueryRuntime, QueryFnReturnType } from "../local_query_runtime";
import { typeRegistry } from "@/data/type_registry";

export class JSSimpleRuntime extends LocalQueryRuntime {
    execute(query: string, source: DataTable): Promise<QueryFnReturnType<DataTable>> {
        return new Promise((resolve) => {
            if (source.getColumnCount() === 0 || source.getRowCount() === 0 || query === "") {
                resolve({ targets: {}, edgeCounts: {} });
                return;
            }
            if (!window.Blockly.typeRegistry) window.Blockly.typeRegistry = typeRegistry
            const rows = source.getRows()

            try {
                // we assume that only one source with the name root is present
                const queryFunction = new Function("init", `${query};return query_root(init);`)
                const result: QueryFnReturnType<DataRow[]> = queryFunction(rows)
                const tables: Record<string, DataTable> = {}
                for (const [id, rows] of Object.entries(result.targets)) {
                    tables[id] = DataTable.fromRows(rows, source.getColumnTypes(), source.getColumnNames())
                }

                resolve({ targets: tables, edgeCounts: result.edgeCounts })
                return;
            } catch (e) {
                console.warn(e)
                resolve({ targets: {}, edgeCounts: {} });
                return;
            }
        })
    }
}