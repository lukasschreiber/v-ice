import { DataTable, DataRow } from "@/data/table";
import { LocalQueryRuntime, QueryFnReturnType } from "../local_query_runtime";
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core"
import variant from "#quickjs"

export const QuickJS = await newQuickJSWASMModuleFromVariant(variant)

export class JSSecureRuntime extends LocalQueryRuntime {
    public initialize(): Promise<void> {
       return super.initialize();
    }

    execute(query: string): Promise<QueryFnReturnType<DataTable>> {
        return new Promise(async (resolve) => {
            if (!this.source || this.source.columns.length === 0 || this.source.rows.length === 0 || query === "") {
                resolve({ targets: {}, edgeCounts: {} });
                return; 
            }

            try {
                const vm = QuickJS.newContext();
                const wrappedQuery = `
                    (function() {
                        ${query};
                        return JSON.stringify(query_root(${JSON.stringify(this.source.rows)}));
                    })();
                `;

                const resultHandle = vm.evalCode(wrappedQuery);

                if (resultHandle.error) {
                    console.warn(resultHandle.error);
                    resolve({ targets: {}, edgeCounts: {} });
                    vm.dispose();
                    return;
                }
                
                const resultJSON = vm.getString(resultHandle.value);

                if (typeof resultJSON !== "string") {
                    console.warn("Expected JSON string, but got:", typeof resultJSON);
                    resolve({ targets: {}, edgeCounts: {} });
                    vm.dispose();
                    return;
                }

                const result: QueryFnReturnType<DataRow[]> = JSON.parse(resultJSON);
                const tables: Record<string, DataTable> = {};

                for (const [id, rows] of Object.entries(result.targets)) {
                    tables[id] = DataTable.fromRows(rows, this.source.columns.map(it => it.type), this.source.columns.map(it => it.name));
                }

                vm.dispose();
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
