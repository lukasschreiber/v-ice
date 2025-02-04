import { type NormalizedDataTable } from "@/data/table";

declare const self: Worker & { rows?: NormalizedDataTable["rows"] };

self.rows = [];

self.onmessage = (e: MessageEvent<{ action: "set_rows"; rows: NormalizedDataTable["rows"] } | { action: "run_query"; query: string }>) => {
    const action = e.data.action;

    if (action === "set_rows") {
        self.rows = e.data.rows;
        return;
    }

    if (action === "run_query") {
        try {
            if (!self.rows) {
                throw new Error("Rows are not initialized.");
            }
    
            const queryFunction = new Function("init", `${e.data.query.replace(/`/g, "\\`")}; return query_root(init);`);
            const result = queryFunction(self.rows);
            self.postMessage(result);
        } catch (error) {
            console.warn(error);
            self.postMessage({ targets: {}, edgeCounts: {} });
        }
    }
    
    return;
};
