import { Dispatch, SetStateAction, createContext, useEffect, useState } from "react";
import { DataColumn, DataRow, DataTable, useQuery, Types, useWorkspace } from "v-ice";
import { faker } from "@faker-js/faker";

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
    const [expandable, setExpandable] = useState(true);
    const [dataTables, setDataTables] = useState<DataTableDefinition[]>([]);
    const { workspace } = useWorkspace();
    const [initialized, setInitialized] = useState(false);

    function populateDemoData() {
        setExpandable(true);
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
        const baseTargetId = addTarget("Target")
        setDataTables([{ name: "Source", type: "SOURCE", immutable: true }, { name: "Target", type: "TARGET", immutable: false, uid: baseTargetId }]);
        setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspace]);

    function dataIsLikeDemoData(data: DataTable) {
        return data.getColumns().every((column, index) => {
            const referenceColumn = dataTable.getColumn(index);
            if (referenceColumn && column.name === referenceColumn.name && column.type === referenceColumn.type) {
                return true;
            }
        });
    }

    function generateCourseName() {
        const courseNames = [
            "Chemistry",
            "Biology",
            "Physics",
            "Mathematics",
            "History",
            "Literature",
            "Computer Science",
            "Art",
            "Music",
            "Geography",
        ];
        const randomIndex = Math.floor(Math.random() * courseNames.length);
        return courseNames[randomIndex];
    }

    function clearData() {
        setQuerySource(DataTable.empty());
    }

    function reset() {
        clearData();
        populateDemoData();
    }

    function addRow(partialRow: DataRow) {
        const clonedSource = querySource.clone();
        const rowValues = [
            faker.person.firstName(),
            faker.number.int({ min: 12, max: 40 }),
            faker.datatype.boolean(0.8),
            faker.number.float({ min: 1.0, max: 4.0, multipleOf: 0.1 }),
            generateCourseName(),
        ];
        const newRow = Object.fromEntries(
            clonedSource
                .getColumns()
                .map((column) => [
                    column.name,
                    partialRow[column.name] ??
                        rowValues[clonedSource.getColumns().indexOf(column)] ??
                        Math.floor(Math.random() * 100),
                ])
        );

        clonedSource.addRow(newRow);
        setQuerySource(clonedSource);
    }

    function addCol() {
        const clonedSource = querySource.clone();
        const newCol = new DataColumn(
            `New #${clonedSource.getColumnCount() - dataTable.getColumnCount() + 1}`,
            Types.number,
            Array(clonedSource.getRowCount())
                .fill(0)
                .map(() => Math.floor(Math.random() * 100))
        );
        clonedSource.addColumn(newCol);
        setQuerySource(clonedSource);
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

    return (
        <DataContext.Provider
            value={{
                source: querySource,
                setSource: setQuerySource,
                addCol,
                addRow,
                reset,
                save,
                sort,
                queryResults,
                isExpandable: expandable,
                setExpandable,
                dataIsLikeDemoData,
                addTarget,
                removeTarget,
                targets,
                dataTables,
                setDataTables,
            }}
        >
            {props.children}
        </DataContext.Provider>
    );
}

export const DataContext = createContext<{
    source: DataTable;
    queryResults: Record<string, DataTable>;
    setSource: (source: DataTable) => void;
    addRow(partialRow: DataRow): void;
    addCol(): void;
    reset(): void;
    save(): void;
    sort(sortBy: string, ascending: boolean): void;
    isExpandable: boolean;
    setExpandable: (newValue: boolean) => void;
    dataIsLikeDemoData: (data: DataTable) => boolean
    addTarget(name: string): string;
    removeTarget(id: string): void;
    targets: Record<string, string>;
    dataTables: DataTableDefinition[];
    setDataTables: Dispatch<SetStateAction<DataTableDefinition[]>>
}>({
    source: DataTable.empty(),
    queryResults: {},
    setSource: () => {},
    addCol: () => {},
    addRow: () => {},
    reset: () => {},
    save: () => {},
    sort: () => {},
    isExpandable: true,
    setExpandable: () => {},
    dataIsLikeDemoData: () => false,
    addTarget: () => "",
    removeTarget: () => {},
    targets: {},
    dataTables: [],
    setDataTables: () => {},
});
