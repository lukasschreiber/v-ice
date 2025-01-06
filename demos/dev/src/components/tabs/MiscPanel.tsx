import { DataColumn, DataTable, IType, QueryBackend, ValueOf, useQuery, useSettings } from "v-ice";
import { useState } from "react";
import { Button } from "../Button";
import { ScreenshotModal } from "../ScreenshotModal";
import { Toolbox, useWorkspace } from "@/main";
import { showNotification } from "@/store/notifications/notification_emitter";
import types from "@/data/types";
import { TypeIconPreview } from "@/components/common/TypeIconPreview";
import { faker } from "@faker-js/faker";

export function MiscPanel() {
    const { settings, set } = useSettings();
    const { workspace, save, load } = useWorkspace();
    const [language, setLanguage] = useState(localStorage.getItem("language") ?? "en");
    const {setQuerySource} = useQuery();
    const [screenshotModeEnabled, setScreenshotModeEnabled] = useState(false);

    const fakerFunctions: [string, IType, () => unknown, null | string][] = [
        ["Number", types.number, () => faker.number.int(), null],
        ["Word", types.string, () => faker.lorem.word(), null],
        ["Boolean", types.boolean, () => faker.datatype.boolean(), null],
        ["Date", types.timestamp, () => faker.date.recent().toISOString(), null],
        ["Animal", types.enum("Dog"), () => faker.animal.dog(), "Dog"],
        ["Animal", types.enum("Cat"), () => faker.animal.cat(), "Cat"],
        ["Street", types.string, () => faker.location.street(), null],
        ["City", types.string, () => faker.location.city(), null],
        ["Country", types.string, () => faker.location.country(), null],
        ["Latitude", types.number, () => faker.location.latitude(), null],
        ["Longitude", types.number, () => faker.location.longitude(), null],
        ["Email", types.string, () => faker.internet.email(), null],
        ["Phone", types.string, () => faker.phone.number(), null],
        ["Company", types.string, () => faker.company.name(), null],
        ["Job Title", types.string, () => faker.person.jobTitle(), null],
        ["Name", types.string, () => faker.person.fullName(), null],
        ["Age", types.number, () => faker.number.int({ min: 18, max: 99 }), null],
    ];

    async function runPerformanceTest(fromRows: number,toRows: number, fromCols: number, toCols: number, seed: number) {
        const results = [];
        for (let rows = fromRows; rows <= toRows; rows += 10) {
            for (let cols = fromCols; cols <= toCols; cols += 10) {
                const data = loadPerformanceTestData(rows, cols, seed);
                setQuerySource(data);

                await new Promise((resolve) => setTimeout(resolve, 2000));

                const start = performance.now();
                const query = QueryBackend.generateQuery(workspace!);
                QueryBackend.runQuery(query, data);
                const end = performance.now();
                const duration = end - start;

                results.push({ rows, cols, duration });
            }
        }

        return results;
    }
    
    function loadPerformanceTestData(rows: number, cols: number, seed: number) {
        faker.seed(seed);  // Set the seed for reproducibility
        const data = new DataTable();
        const nameCounts = new Map<string, number>();
    
        // use faker to generate random data
        for (let i = 0; i < cols; i++) {
            const typeIndex = i % fakerFunctions.length;
            const [_name, type, fakerFunction, enumDefinition] = fakerFunctions[typeIndex];
            let name = _name;

            // Ensure unique column names
            if (nameCounts.has(name)) {
                while (nameCounts.has(name)) {
                    nameCounts.set(name, nameCounts.get(name)! + 1);
                    name = `${name} ${nameCounts.get(name)}`;
                }
            } else {
                nameCounts.set(name, 1);
            }

            if (enumDefinition) {
                types.registry.registerEnum(enumDefinition, { columns: [name] });
            }
    
            const columnData = Array.from({ length: rows }, () => fakerFunction());
            data.addColumn(new DataColumn(name, type, columnData as ValueOf<typeof type>[]));
        }
    
        return data;
    }

    return (
        <div className="p-3">
            <div className="flex flex-row gap-2">
                <div>Zoom</div>
                <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.01}
                    value={settings.zoom}
                    onChange={(e) => set("zoom", parseFloat(e.target.value))}
                />
                <div>{settings.zoom.toFixed(2)}</div>
            </div>
            <hr className="my-2" />
            <div className="flex flex-row gap-2">
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-white rounded-sm border-slate-300 border border-solid"
                >
                    <option value="de">German</option>
                    <option value="en">English</option>
                </select>
                <Button
                    onClick={() => {
                        localStorage.setItem("language", language);
                        location.reload();
                    }}
                    className="bg-slate-300 !text-slate-800"
                >
                    Save Language and Reload
                </Button>
            </div>
            <hr className="my-2" />
            <div className="flex flex-row gap-2">
                <Button
                    onClick={() => {
                        setScreenshotModeEnabled((old) => !old);
                    }}
                >
                    Take a Block Screenshot
                </Button>
                <Button
                    onClick={() => {
                        const text = workspace
                            .getTopBlocks()
                            .map((block) => {
                                const definition = Toolbox.utils.blockToBlockDefinition(block);
                                return `::block-preview{block="${JSON.stringify(definition).replace(/"/g, "'")}"}`;
                            })
                            .join("\n");
                        navigator.clipboard.writeText(text);
                    }}
                >
                    Copy MD Block Preview to Clipboard
                </Button>
            </div>
            <hr className="my-2" />
            <div className="flex flex-row gap-2">
                <Button
                    onClick={() => {
                        const state = save();
                        load(state);
                        showNotification("Workspace state restored");
                    }}
                >
                    Reload
                </Button>
                <Button
                    onClick={() => {
                        
                    }}
                >
                    Print Help
                </Button>
            </div>
            <hr className="my-2" />
            <div className="flex flex-row gap-2">
                <Button
                    onClick={() => {
                        const data = loadPerformanceTestData(5, 5, 1234);
                        setQuerySource(data);
                        showNotification("Performance test prepared");
                    }}
                >
                    Prepare Performance Test
                </Button>
                <Button
                    onClick={async () => {
                        const results = await runPerformanceTest(5, 10, 5, 10, 1234);
                        console.table(results);
                    }}
                >
                    Run Performance Test
                </Button>
            </div>
            <hr className="my-2" />
            <div>
                <h2 className="mb-4">Test Type Icons</h2>
                <div className="flex flex-row gap-4">
                    <div className="flex flex-col space-y-4 text-xs">
                        <div className="flex items-center flex-col">Type</div>
                        <div className="h-6 flex items-center flex-col">I.</div>
                        <div className="h-6 flex items-center flex-col">II.</div>
                        <div className="h-6 flex items-center flex-col">III.</div>
                        <div className="h-6 flex items-center flex-col">IV.</div>
                    </div>
                    {[
                        [
                            types.number,
                            types.nullable(types.number),
                            types.list(types.number),
                            types.nullable(types.list(types.number)),
                        ],
                        [
                            types.string,
                            types.nullable(types.string),
                            types.list(types.string),
                            types.nullable(types.list(types.string)),
                        ],
                        [
                            types.boolean,
                            types.nullable(types.boolean),
                            types.list(types.boolean),
                            types.nullable(types.list(types.boolean)),
                        ],
                        [
                            types.struct(types.wildcard),
                            types.nullable(types.struct(types.wildcard)),
                            types.list(types.struct(types.wildcard)),
                            types.nullable(types.list(types.struct(types.wildcard))),
                        ],
                        [
                            types.hierarchy(types.wildcard),
                            types.nullable(types.hierarchy(types.wildcard)),
                            types.list(types.hierarchy(types.wildcard)),
                            types.nullable(types.list(types.hierarchy(types.wildcard))),
                        ],
                        // [types.enum(types.wildcard), types.nullable(types.enum(types.wildcard)), types.list(types.enum(types.wildcard)), types.nullable(types.list(types.enum(types.wildcard)))],
                        [
                            types.timestamp,
                            types.nullable(types.timestamp),
                            types.list(types.timestamp),
                            types.nullable(types.list(types.timestamp)),
                        ],
                        [
                            types.wildcard,
                            types.nullable(types.wildcard),
                            types.list(types.wildcard),
                            types.nullable(types.list(types.wildcard)),
                        ],
                        [types.event(types.enum(types.wildcard))],
                        [types.interval(types.enum(types.wildcard))],
                        [types.timeline(types.event(types.enum(types.wildcard)))],
                    ].map((types, colIndex) => {
                        return (
                            <div className="flex flex-col space-y-4" key={colIndex}>
                                <div className="text-xs flex items-center justify-center">
                                    ({["a", "b", "c", "d", "e", "f", "g", "h", "i", "k", "m", "n"][colIndex]})
                                </div>
                                {types.map((type) => {
                                    return <TypeIconPreview key={type.name} type={type.name} />;
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
            <ScreenshotModal open={screenshotModeEnabled} onClose={() => setScreenshotModeEnabled(false)} />
        </div>
    );
}
