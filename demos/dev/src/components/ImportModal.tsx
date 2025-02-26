import { Button } from "./Button";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "./DataContext";
import { DataTable, CsvOptions, Types, ColumnType } from "v-ice";
import { Table, TableHeader } from "@v-ice/commons";
import { Modal, ModalBody, ModalHeader, ModalProps } from "../Modal";

const delimiters = [",", ";"];

export function ImportModal(props: ModalProps & { file?: File }) {
    const { open, onClose, file, ...rest } = props;
    const { setSource } = useContext(DataContext);
    const [manualOverride, setManualOverride] = useState(false);
    const [columnNames, setColumnNames] = useState<string[]>([]);
    const [columnTypes, setColumnTypes] = useState<ColumnType[]>([]);
    const [csvOptions, setCsvOptions] = useState<{ delimiter: string; header: boolean; newLine: string }>({
        delimiter: ",",
        header: true,
        newLine: "\n",
    });
    const [table, setTable] = useState<DataTable | null>(null);

    useEffect(() => {
        if (file) {
            if (file.type === "text/csv") {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target!.result as string;
                    const newLine = content.includes("\r\n") ? "\r\n" : "\n";

                    let delimiter = csvOptions.delimiter;
                    if (!manualOverride) {
                        const delimiterCounts = delimiters.map((delimiter) => {
                            const rowSplitRegex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`, "g");
                            return content.split(newLine)[0].split(rowSplitRegex).length;
                        });
                        delimiter = delimiters[delimiterCounts.indexOf(Math.max(...delimiterCounts))];
                        if (delimiter !== csvOptions.delimiter || newLine !== csvOptions.newLine) {
                            setCsvOptions({ delimiter: delimiter, header: true, newLine });
                        }
                    }
                    const options: Partial<CsvOptions> = {
                        delimiter: delimiter,
                        newLine: newLine,
                        header: csvOptions.header,
                        columnNames: undefined,
                    };
                    if (!csvOptions.header) {
                        options.columnNames = content
                            .split(newLine)[0]
                            .split(delimiter)
                            .map((_, index) => `Column${index + 1}`);
                    }
                    DataTable.fromCSV(file, options).then((source) => setTable(source));
                };
                reader.readAsText(file);
            } else if (file.type === "application/json") {
                const reader = new FileReader();
                reader.onload = (event) => {
                    let json = JSON.parse(event.target!.result as string);
                    if (!Object.prototype.hasOwnProperty.call(json, "table")) {
                        json = { table: json };
                    }
                    const source = DataTable.fromJSON(json);
                    setTable(source);
                };
                reader.readAsText(file);
            }
        }
    }, [file, csvOptions, manualOverride]);

    function getFinalTable() {
        if (table) {
            const newTable = table.clone();
            newTable.setColumnNames(columnNames);
            newTable.setColumnTypes(columnTypes);
            return newTable;
        }
        return null;
    }

    useEffect(() => {
        if (table) {
            setColumnNames((oldColumnNames) => {
                if (JSON.stringify(table.getColumnNames()) !== JSON.stringify(oldColumnNames))
                    return table.getColumnNames();
                return oldColumnNames;
            });
            setColumnTypes((oldColumnTypes) => {
                if (JSON.stringify(table.getColumnTypes()) !== JSON.stringify(oldColumnTypes))
                    return table.getColumnTypes();
                return oldColumnTypes;
            });
        }
    }, [table]);

    function bytesToSize(bytes: number) {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        if (bytes === 0) return "0 Byte";
        const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));
        return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
    }

    function timestampToDateTime(timestamp: number) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    return (
        <Modal open={open} onClose={onClose} {...rest}>
            <ModalHeader>Import</ModalHeader>
            <ModalBody>
                {file && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <div>
                                <span className="font-medium">Name:</span>{" "}
                                <span className="text-slate-500 text-sm">{file.name}</span>{" "}
                                <span className="rounded-full bg-blue-300 text-blue-800 text-xs py-1 px-1.5">
                                    {file.type === "text/csv"
                                        ? "CSV"
                                        : file.type === "application/json"
                                        ? "JSON"
                                        : "unknown"}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium">Size:</span>{" "}
                                <span className="text-slate-500 text-sm">{bytesToSize(file.size)}</span>
                            </div>
                            <div>
                                <span className="font-medium">Last Modified:</span>{" "}
                                <span className="text-slate-500 text-sm">{timestampToDateTime(file.lastModified)}</span>
                            </div>
                        </div>
                        {file.type === "text/csv" && (
                            <div className="flex flex-col gap-1">
                                <div>
                                    <span className="font-medium">Delimiter:</span>{" "}
                                    <span className="text-slate-500 text-sm">
                                        <input
                                            type="text"
                                            className="border border-slate-300 w-8 text-center rounded-md"
                                            value={csvOptions.delimiter}
                                            onChange={(e) => {
                                                setCsvOptions((oldOptions) => ({
                                                    newLine: oldOptions.newLine,
                                                    header: oldOptions.header,
                                                    delimiter: e.target.value,
                                                }));
                                                setManualOverride(true);
                                            }}
                                        />
                                    </span>{" "}
                                    <span
                                        className="text-sm text-blue-500 underline cursor-pointer"
                                        onClick={() => setManualOverride(false)}
                                    >
                                        auto-detect
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">Header:</span>{" "}
                                    <span className="text-slate-500 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={csvOptions.header}
                                            onChange={(e) => {
                                                setCsvOptions((oldOptions) => ({
                                                    newLine: oldOptions.newLine,
                                                    header: e.target.checked,
                                                    delimiter: oldOptions.delimiter,
                                                }));
                                            }}
                                        />
                                    </span>
                                </div>
                            </div>
                        )}
                        {table && (
                            <>
                                <div className="flex flex-col gap-1">
                                    <div>
                                        <span className="font-medium">Lines:</span>{" "}
                                        <span className="text-slate-500 text-sm">{table.getRowCount()}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Columns:</span>{" "}
                                        <span className="text-slate-500 text-sm">{table.getColumnCount()}</span>
                                    </div>
                                </div>
                                <Table dataTable={table} page={0} rowsPerPage={5} header={false} className="overflow-y-auto max-h-[500px]">
                                    <TableHeader>
                                        <tr>
                                            {table.getColumns().map((_, colIndex) => (
                                                <th key={"h_" + colIndex} className="border border-slate-200">
                                                    {columnNames[colIndex] !== undefined && (
                                                        <input
                                                            type="text"
                                                            className="w-full outline-none px-2 py-1"
                                                            value={columnNames[colIndex]}
                                                            onChange={(e) => {
                                                                setColumnNames((oldNames) => {
                                                                    const newNames = [...oldNames];
                                                                    newNames[colIndex] = e.target.value;
                                                                    return newNames;
                                                                });
                                                            }}
                                                        />
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                        <tr>
                                            {table.getColumns().map((_, colIndex) => (
                                                <th key={"h_" + colIndex} className="border border-slate-200">
                                                    {columnTypes[colIndex] && (
                                                        <select
                                                            defaultValue={columnTypes[colIndex].name}
                                                            className="outline-none w-full px-2 py-1 min-w-20"
                                                            onChange={(e) => {
                                                                setColumnTypes((oldTypes) => {
                                                                    const newTypes = [...oldTypes];
                                                                    newTypes[colIndex] = Types.utils.fromString(
                                                                        e.target.value
                                                                    );
                                                                    return newTypes;
                                                                });
                                                            }}
                                                        >
                                                            <option value={columnTypes[colIndex].name}>
                                                                {columnTypes[colIndex].name}
                                                            </option>
                                                        </select>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </TableHeader>
                                </Table>
                            </>
                        )}
                        <Button
                            onClick={() => {
                                const finalTable = getFinalTable();
                                if (finalTable) {
                                    console.time("setSource");
                                    setSource(finalTable);
                                    console.timeEnd("setSource");
                                }
                                onClose();
                            }}
                            className="max-w-fit px-8"
                        >
                            Import
                        </Button>
                    </div>
                )}
            </ModalBody>
        </Modal>
    );
}
