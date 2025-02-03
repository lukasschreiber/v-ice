import { type DataRow } from "@/data/table";

self.onmessage = (e: MessageEvent<{rows: DataRow[], query: string}>) => {
    try {
        const { rows, query } = e.data;
        const queryFunction = new Function("init", `${query.replaceAll("`", "\\`")};return query_root(init);`);
        const result = queryFunction(rows);
        self.postMessage(result);
    } catch (error) {
        console.warn(error);
        self.postMessage({ targets: {}, edgeCounts: {} });
    }
};