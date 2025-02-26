import { DataTable, DataTableRead, IType, Types, ValueOf } from "v-ice";
import React from "react";
import { DateTime } from "luxon";

export function Table(
    props: React.HTMLProps<HTMLTableElement> & {
        dataTable: DataTableRead;
        highlightedRows?: number[];
        page: number;
        rowsPerPage: number;
        header?: boolean;
        showIndex?: boolean;
    }
) {
    const {
        dataTable,
        highlightedRows,
        page,
        rowsPerPage,
        header = true,
        showIndex = false,
        className,
        ...rest
    } = props;

    // Memoize headers and rows
    const headers = React.useMemo(
        () => dataTable.getColumns(showIndex),
        [dataTable, showIndex]
    );

    const rows = React.useMemo(() => {
        const start = page * rowsPerPage;
        const end = start + rowsPerPage;
        return dataTable.getRows().slice(start, end);
    }, [dataTable, page, rowsPerPage]);

    const formatTableCell = React.useCallback(
        <T extends IType>(value: ValueOf<T>, type: T) => {
            if (Types.utils.isTimestamp(type)) {
                return DateTime.fromISO(value as string)
                    .setLocale("de-DE")
                    .toLocaleString();
            }
            if (value === undefined || value === null) {
                return <span>unknown</span>;
            }
            if (Types.utils.isList(type)) {
                return (
                    <div className="flex flex-row gap-1">
                        {(value as ValueOf<typeof type>).map((item, index) => (
                            <div key={index} className="flex flex-row items-end">
                                <div>{formatTableCell(item, type.elementType)}</div>
                                {index < (value as any[]).length - 1 && ","}
                            </div>
                        ))}
                    </div>
                );
            }
            if (Types.utils.isStruct(type)) {
                return Object.entries(type.fields).map(([key, fieldType]) => (
                    <div key={key}>
                        {key}: {formatTableCell((value as never)[key], fieldType)}
                    </div>
                ));
            }
            return value.toString();
        },
        []
    );

    const renderTableHeader = React.useMemo(
        () => (
            <thead className="text-xs text-gray-700 bg-gray-100">
                <tr>
                    {headers.map((col, colIndex) => (
                        <th key={`h_${colIndex}`} className="px-2 py-1 whitespace-nowrap font-medium">
                            {col.name === DataTable.indexColumnName_ ? "#" : col.name}
                        </th>
                    ))}
                </tr>
            </thead>
        ),
        [headers]
    );

    const renderTableBody = React.useMemo(
        () => (
            <tbody>
                {rows.length === 0 ? (
                    <tr>
                        <td colSpan={headers.length} className="text-center py-5 border-b">
                            No data available
                        </td>
                    </tr>
                ) : (
                    rows.map((row) => (
                        <tr
                            key={row[DataTable.indexColumnName_]}
                            className={`border-b ${
                                highlightedRows?.includes(row[DataTable.indexColumnName_]) ? "bg-green-100 border-green-200" : "bg-white"
                            }`}
                        >
                            {headers.map((col, colIndex) => (
                                <td key={`${row[DataTable.indexColumnName_]}_${colIndex}`} className="px-2 py-1 whitespace-nowrap align-top">
                                    {formatTableCell(col.values[row[DataTable.indexColumnName_]], col.type)}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
            </tbody>
        ),
        [rows, headers, highlightedRows, formatTableCell]
    );

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table {...rest} className="overflow-hidden text-xs text-left text-gray-500 table-auto min-w-full">
                {header  !== false ? renderTableHeader : props.children}
                {renderTableBody}
            </table>
        </div>
    );
}

export function TableHeader(props: React.HTMLProps<HTMLTableSectionElement>) {
    return <thead {...props}>{props.children}</thead>;
}
