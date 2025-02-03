import { DataTable, DataRow } from "@/data/table";
import { LocalQueryRuntime, QueryFnReturnType } from "../local_query_runtime";
import { typeRegistry } from "@/data/type_registry";
import 'ses';

export class JSHardenedRuntime extends LocalQueryRuntime {
    execute(query: string, source: DataTable): Promise<QueryFnReturnType<DataTable>> {
        return new Promise((resolve) => {
            if (source.getColumnCount() === 0 || source.getRowCount() === 0 || query === "") {
                resolve({ targets: {}, edgeCounts: {} });
                return;
            }

            const compartment = new Compartment({
                console,
                // Expose only the necessary parts of the source
                source: {
                    getRows: source.getRows(),
                    getColumnCount: source.getColumnCount(),
                    getRowCount: source.getRowCount(),
                    getColumnTypes: source.getColumnTypes(),
                    getColumnNames: source.getColumnNames(),
                },
                // Only expose part of the registry maybe
                typeRegistry,
            });

            try {
                const queryFunction = compartment.evaluate(`
                    (rows) => {
                        ${query};
                        return query_root(rows);
                    }
                `);

                const result: QueryFnReturnType<DataRow[]> = queryFunction(source.getRows());
                const tables: Record<string, DataTable> = {};

                for (const [id, rows] of Object.entries(result.targets)) {
                    tables[id] = DataTable.fromRows(rows, source.getColumnTypes(), source.getColumnNames());
                }

                resolve({ targets: tables, edgeCounts: result.edgeCounts });
                return;
            } catch (e) {
                console.warn(e);
                resolve({ targets: {}, edgeCounts: {} });
                return;
            }
        });
    }
}
