import { DataRow, DataTable } from "@/data/table";
import { QueryFnReturnType } from "@/query/clients/local_query_runtime";
import { BaseWorker } from "./js_base_query_worker";
import { QuickJSContext, QuickJSHandle, newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core"
import variant from "#quickjs"

(async () => {

    const QuickJS = await newQuickJSWASMModuleFromVariant(variant)

    class SecureQueryWorker extends BaseWorker {
        private vm: QuickJSContext
        private disposables: QuickJSHandle[] = []

        constructor() {
            super()
            this.vm = QuickJS.newContext()
        }

        private marshal(value: unknown): QuickJSHandle {
            switch (typeof value) {
                case "boolean": {
                    return value ? this.vm.true : this.vm.false;
                }
                case "number": {
                    const handle = this.vm.newNumber(value);
                    this.disposables.push(handle);
                    return handle;
                }
                case "string": {
                    const handle = this.vm.newString(value);
                    this.disposables.push(handle);
                    return handle;
                }
                case "undefined": {
                    return this.vm.undefined;
                }
                case "object": {
                    if (value === null) {
                        return this.vm.null;
                    } else if (Array.isArray(value)) {
                        const array = this.vm.newArray();
                        this.disposables.push(array);
                        value.forEach((item, index) => {
                            this.vm.setProp(array, index, this.marshal(item));
                        });
                        return array;
                    } else {
                        const object = this.vm.newObject();
                        this.disposables.push(object);
                        for (const [key, val] of Object.entries(value)) {
                            this.vm.setProp(object, this.marshal(key), this.marshal(val));
                        }
                        return object;
                    }
                }
                default: {
                    throw new Error(`Unsupported type: ${typeof value}`);
                }
            }
        }

        private dispose() {
            this.disposables.forEach(handle => handle.alive && handle.dispose());
            this.disposables = [];
        }

        protected override setRows(rows: DataRow[]) {
            this.dispose();
            this.vm.setProp(this.vm.global, "rows", this.marshal(rows));
        }

        protected runQuery(query: string) {
            if (!this.rows) {
                console.warn("Rows are not initialized.");
                self.postMessage({ targets: {}, edgeCounts: {} });
                return;
            }

            try {
                const wrappedQuery = `
                (function() {
                    ${query};
                    const result = query_root(rows);
                    return JSON.stringify({
                        targets: Object.fromEntries(
                            Object.entries(result.targets).map(([key, rows]) => [
                                key,
                                rows.map(row => row["${DataTable.indexColumnName_}"]),
                            ])
                        ),
                        edgeCounts: result.edgeCounts
                    });
                })();
            `;

                const resultHandle = this.vm.evalCode(wrappedQuery);

                if (resultHandle.error) {
                    console.warn(resultHandle.error);
                    self.postMessage({ targets: {}, edgeCounts: {} });
                    return;
                }

                const resultJSON = this.vm.getString(resultHandle.value);

                if (typeof resultJSON !== "string") {
                    console.warn("Expected JSON string, but got:", typeof resultJSON);
                    self.postMessage({ targets: {}, edgeCounts: {} });
                    return;
                }

                const output: QueryFnReturnType<number[]> = JSON.parse(resultJSON);
                self.postMessage(output);
                return;
            } catch (e) {
                console.warn(e);
                self.postMessage({ targets: {}, edgeCounts: {} });
                return;
            }
        }
    }

    new SecureQueryWorker();

}
)();
