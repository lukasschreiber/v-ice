import { describe, expect, test } from "vitest";
import { JSHardenedRuntime } from "./js_hardened_runtime";
// import { DataColumn, DataTable } from "@/data/table";
// import types from "@/data/types";

describe("Hardened Runtime", () => {
    const runtime = new JSHardenedRuntime();
    // const source = new DataTable([
    //     new DataColumn("name", types.string, ["Alice", "Bob", "Charlie"]),
    //     new DataColumn("age", types.number, [20, 30, 40]),
    // ]);

    test("Hardened Runtime is enabled", () => {
        expect(runtime).toBeDefined();
    });

    test("Hardened Runtime can execute a query", async () => {
        // const result = await runtime.execute(`
        //     const ages = rows.map(row => row.age);
        //     return { targets: { ages } };
        // `, source);

        // console.log(result);
    });
})