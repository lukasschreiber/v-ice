import { DataTable, IndexedDataRow } from "v-ice";
import { Table } from "v-ice-commons";
import { Button } from "../Button";
import { useContext, useState, useEffect, useMemo, useRef } from "react";
import { DataContext, DataTableDefinition } from "../DataContext";
import { ImportModal } from "../ImportModal";
import { Accordion } from "../Accordion";

export function DataPanel() {
    const { source, getQueryResultById, reset, save, sort, addTarget, removeTarget, dataTables, setDataTables } =
        useContext(DataContext);
    const [page, setPage] = useState(0);
    const [sortBy, setSortBy] = useState("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [highlightOnly, setHighlightOnly] = useState(true);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importModalFile, setImportModalFile] = useState<File | undefined>(undefined);
    const [selectedTable, setSelectedTable] = useState<DataTableDefinition | undefined>(undefined);
    const [currentTable, setCurrentTable] = useState<DataTable>(new DataTable());
    const [newTarget, setNewTarget] = useState<DataTableDefinition>({ name: "", type: "TARGET", immutable: false });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedTable?.type === "SOURCE") {
            setCurrentTable(source);
        } else if (selectedTable && selectedTable.uid) {
            const table = getQueryResultById(selectedTable.uid);
            if (table) {
                setCurrentTable(table);
            }
        } else {
            setCurrentTable(DataTable.fromRows([], source.getColumnTypes(), source.getColumnNames()));
        }
    }, [getQueryResultById, selectedTable, source]);

    const highlightedRows = useMemo(() => {
        return highlightOnly
            ? source
                  .getRows()
                  .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                  .map((row, index) => [row, index])
                  .filter(([row]) =>
                      currentTable.getRows().find((r) => (row as IndexedDataRow).index_ === r.index_)
                  )
                  .map(([, index]) => index as number)
            : undefined;
    }, [highlightOnly, source, currentTable, page, rowsPerPage]);

    const lastPage = useMemo(
        () =>
            highlightOnly
                ? Math.ceil(source.getRowCount() / rowsPerPage)
                : Math.ceil(currentTable.getRowCount() / rowsPerPage),
        [currentTable, rowsPerPage, source, highlightOnly]
    );

    useEffect(() => {
        if (sortBy === "" && source.getColumnNames().length > 0) {
            setSortBy(source.getColumnNames()[0]!);
        }
    }, [source, sortBy]);

    useEffect(() => {
        if (sortBy !== "") sort(sortBy, sortOrder === "asc");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, sortOrder]);

    useEffect(() => {
        if (page >= lastPage - 1) {
            setPage(Math.max(0, lastPage - 1));
        }
    }, [page, lastPage]);

    useEffect(() => {
        if (selectedTable === undefined && dataTables.length > 0) {
            setSelectedTable(dataTables.find((table) => table.type === "TARGET") ?? dataTables[0]);
        }
    }, [dataTables, selectedTable]);

    return (
        <>
            <Accordion title="Manage Targets" defaultOpen={false}>
                <table className="overflow-hidden text-sm text-left text-gray-500 table-auto min-w-full">
                    <thead className="text-xs text-gray-700 bg-gray-100">
                        <tr>
                            <th className="px-2 py-1 whitespace-nowrap font-medium">Name</th>
                            <th className="px-2 py-1 whitespace-nowrap font-medium">Type</th>
                            <th className="px-2 py-1 whitespace-nowrap font-medium text-center">Selected</th>
                            <th className="px-2 py-1 whitespace-nowrap font-medium text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        {dataTables.map((table, index) => (
                            <tr key={index} className="border-b">
                                <td className="px-2 py-1 whitespace-nowrap">{table.name}</td>
                                <td className="px-2 py-1 whitespace-nowrap">{table.type}</td>
                                <td className="px-2 py-1 whitespace-nowrap text-center">
                                    <input
                                        type="radio"
                                        name="viewTable"
                                        onChange={() =>
                                            setSelectedTable(dataTables.find((t) => t.name === table.name)!)
                                        }
                                        checked={selectedTable?.name === table.name}
                                    />
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-center">
                                    {table.immutable ? null : (
                                        <Button
                                            onClick={() => {
                                                removeTarget(table.uid!);
                                                setDataTables((prev) => {
                                                    const newTables = [...prev];
                                                    newTables.splice(index, 1);
                                                    return newTables;
                                                });
                                            }}
                                            className="!text-red-600 bg-red-200 bg-transparent text-xs uppercase"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        <tr className="border-b">
                            <td className="px-2 py-1 whitespace-nowrap">
                                <input
                                    type="text"
                                    placeholder="My new target"
                                    className="w-full outline-0"
                                    value={newTarget.name}
                                    onChange={(e) => {
                                        setNewTarget({ ...newTarget, name: e.target.value });
                                    }}
                                />
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap">TARGET</td>
                            <td></td>
                            <td className="px-2 py-1 whitespace-nowrap text-center">
                                <Button
                                    onClick={() => {
                                        const uid = addTarget(newTarget.name, newTarget.name.replace(/\s/g, "_"));
                                        newTarget.uid = uid;
                                        setDataTables((prev) => [...prev, newTarget]);
                                        setNewTarget({ name: "", type: "TARGET", immutable: false });
                                    }}
                                    className="text-green-600 bg-green-200 text-xs uppercase disabled:bg-gray-200 disabled:text-gray-400"
                                    disabled={
                                        newTarget.name === "" ||
                                        dataTables.find((table) => table.name === newTarget.name) !== undefined
                                    }
                                >
                                    Add
                                </Button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </Accordion>
            <Accordion title="Test Data" defaultOpen={true}>
                <div className="m-2 gap-2 flex flex-row items-center text-sm justify-between">
                    <div className="flex flex-row gap-1 items-center">
                        <input
                            type="checkbox"
                            id="highlight"
                            checked={highlightOnly}
                            onChange={(e) => {
                                setHighlightOnly(e.target.checked);
                            }}
                        />
                        <label htmlFor="highlight">Highlight Only</label>
                    </div>
                    <div className="flex flex-row gap-1 items-center">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="max-w-[100px] bg-white rounded-sm border-slate-300 border border-solid"
                        >
                            {source.getColumns().map((col, index) => (
                                <option key={index} value={col.name}>
                                    {col.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                            className="bg-white rounded-sm border-slate-300 border border-solid"
                        >
                            <option value="asc">ASC</option>
                            <option value="desc">DESC</option>
                        </select>
                    </div>
                    <div className="flex flex-row gap-1 items-center">
                        <input
                            type="number"
                            className="w-12 border border-solid border-slate-300 rounded-sm text-center outline-none"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value));
                            }}
                        />
                        Rows per page
                    </div>
                </div>
                <hr className="my-2" />
                <div className="m-2 flex flex-row gap-2 items-center">
                    <Button onClick={() => save()} className="bg-slate-300 !text-slate-800">
                        Save
                    </Button>
                    <label
                        htmlFor="file"
                        className="py-0.5 px-1.5 text-sm rounded-md bg-slate-300 text-slate-800 hover:cursor-pointer"
                    >
                        Import
                    </label>
                    <input
                        id="file"
                        type="file"
                        accept=".json,.csv"
                        onChange={(e) => {
                            setImportModalOpen(true);
                            setImportModalFile(e.target.files![0]);
                        }}
                        ref={fileInputRef}
                        className="hidden"
                    />
                    <Button onClick={() => reset()} className="bg-red-300 !text-red-900">
                        Reset
                    </Button>
                    <div className="flex flex-row gap-2 items-center ml-auto">
                        <Button
                            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                            className="bg-slate-300 !text-slate-800 aspect-square"
                            disabled={page <= 0}
                        >
                            {"<"}
                        </Button>
                        <div className="flex flex-col items-center text-slate-500 text-xs">
                            <div>
                                Page {page + 1} of {Math.max(lastPage, 1)}
                            </div>
                            <div>
                                {(highlightOnly ? source : currentTable).getRowCount() ? (
                                    <>
                                        {page * rowsPerPage + 1} -{" "}
                                        {Math.min(
                                            (page + 1) * rowsPerPage,
                                            (highlightOnly ? source : currentTable).getRowCount()
                                        )}{" "}
                                        of {(highlightOnly ? source : currentTable).getRowCount()}
                                    </>
                                ) : (
                                    "No data"
                                )}
                            </div>
                        </div>
                        <Button
                            onClick={() => setPage((prev) => Math.min(lastPage - 1, prev + 1))}
                            className="bg-slate-300 !text-slate-800 aspect-square"
                            disabled={page >= lastPage - 1}
                        >
                            {">"}
                        </Button>
                    </div>
                </div>
                <Table
                    dataTable={highlightOnly ? source : currentTable}
                    page={page}
                    showIndex={true}
                    rowsPerPage={rowsPerPage}
                    highlightedRows={!selectedTable || selectedTable?.type === "SOURCE" ? undefined : highlightedRows}
                />
            </Accordion>
            <ImportModal
                open={importModalOpen}
                file={importModalFile}
                onClose={() => {
                    setImportModalFile(undefined);
                    setImportModalOpen(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                }}
            />
        </>
    );
}
