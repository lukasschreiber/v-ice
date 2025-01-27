import { Dispatch, SetStateAction, createContext, useEffect, useState } from "react";
import { DataColumn, DataTable, useQuery, Types, useWorkspace } from "v-ice";

Types.registry.registerEnum("Name", {columns: ["Name"]})
Types.registry.registerEnum("Major", {columns: ["Major"]})
const dataTable = DataTable.fromColumns([
    new DataColumn("Name", Types.enum("Name"), ["Alice", "Bob", "Charlie"]),
    new DataColumn("Age", Types.number, [25, 30, 35]),
    new DataColumn("IsStudent", Types.boolean, [true, false, true]),
    new DataColumn("GPA", Types.number, [3.5, 3.0, 3.8]),
    new DataColumn("Major", Types.enum("Major"), ["Computer Science", "Mathematics", "Physics"]),
]);

export type DataTableDefinition = {
    name: string;
    type: "SOURCE" | "TARGET";
    immutable: boolean;
    uid?: string;
};

export function DataContextProvider(props: React.ComponentPropsWithoutRef<"div">) {
    const { querySource, queryResults, setQuerySource, addTarget, removeTarget, targets } = useQuery();
    const [dataTables, setDataTables] = useState<DataTableDefinition[]>([]);
    const [sourceName, setSourceName] = useState("Source");
    const { workspace } = useWorkspace();
    const [initialized, setInitialized] = useState(false);

    function populateDemoData() {
        setQuerySource(dataTable.clone());
    }

    useEffect(() => {
        if(querySource.getColumnCount() > 0){
            try {
               localStorage.setItem("querySource", JSON.stringify(querySource.toJSON()));
            } catch (e) {
                // ignore
            }
        }
    }, [querySource]);

    useEffect(() => {
        if (!workspace || initialized) return;
        const savedQuerySource = JSON.parse(localStorage.getItem("querySource") ?? "null");
        if (savedQuerySource) {
            setQuerySource(DataTable.fromJSON(savedQuerySource));
        } else {
            populateDemoData();
        }

        // add an initial target node
        // FIXME: should not be needed for most basic cases, default target should automatically be added
        const baseTargetId = addTarget("Target", "default_target")
        setDataTables([{ name: "Source", type: "SOURCE", immutable: true }, { name: "Target", type: "TARGET", immutable: false, uid: baseTargetId }]);
        setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspace]);

    function clearData() {
        setQuerySource(DataTable.empty());
    }

    function reset() {
        clearData();
        populateDemoData();
    }


    function save() {
        const timeIndex = new Date().toISOString().replace(/:/g, "-");
        downloadFile(`query-source-${timeIndex}.json`, JSON.stringify(querySource.toJSON()), `data:text/json`);
    }

    function sort(sortBy: string, ascending: boolean) {
        const clonedSource = querySource.clone();
        clonedSource.sort(sortBy, ascending);
        setQuerySource(clonedSource);
    }

    function downloadFile(name: string, text: string, type: string) {
        const elem = document.createElement("a");
        elem.setAttribute("href", `${type};charset=utf-8,${encodeURIComponent(text)}`);
        elem.setAttribute("download", name);
        elem.style.display = "none";
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }

    useEffect(() => {
        setSourceName(querySource.getColumnNames().join(", "));
    }, [querySource]);

    return (
        <DataContext.Provider
            value={{
                source: querySource,
                setSource: setQuerySource,
                sourceName,
                setSourceName,
                reset,
                save,
                sort,
                queryResults,
                addTarget,
                removeTarget,
                targets,
                dataTables,
                setDataTables,
                dataIsInitialized: initialized,
            }}
        >
            {props.children}
        </DataContext.Provider>
    );
}

export const DataContext = createContext<{
    source: DataTable;
    sourceName: string
    queryResults: Record<string, DataTable>;
    setSource: (source: DataTable) => void;
    setSourceName: (sourceName: string) => void;
    reset(): void;
    save(): void;
    sort(sortBy: string, ascending: boolean): void;
    addTarget(name: string, id: string): string;
    removeTarget(id: string): void;
    targets: Record<string, string>;
    dataTables: DataTableDefinition[];
    setDataTables: Dispatch<SetStateAction<DataTableDefinition[]>>;
    dataIsInitialized: boolean;
}>({
    source: DataTable.empty(),
    sourceName: "Source",
    setSourceName: () => {},
    queryResults: {},
    setSource: () => {},
    reset: () => {},
    save: () => {},
    sort: () => {},
    addTarget: () => "",
    removeTarget: () => {},
    targets: {},
    dataTables: [],
    setDataTables: () => {},
    dataIsInitialized: false,
});
