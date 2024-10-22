import { DataTable, IType, Types, ValueOf } from "@nephro-react/filters";
import React from "react";
import { DateTime } from "luxon";

export function Table(
    props: React.HTMLProps<HTMLTableElement> & {
        dataTable: DataTable;
        highlightedRows?: number[] | undefined;
        page: number;
        rowsPerPage: number;
        header?: boolean;
        showIndex?: boolean;
    }
) {
    const { dataTable, highlightedRows, page, header, rowsPerPage, showIndex, children, className, ...rest } = props;

    function formatTableCell<T extends IType>(value: ValueOf<T>, type: T) {
        if (Types.utils.isTimestamp(type)) {
            return DateTime.fromISO(value as string).setLocale("de-DE").toLocaleString();
        }
        if (value === undefined || value === null) {
            return <span>unknown</span>;
        }
        if (Types.utils.isTimeline(type)) {
            const timeline = value as ValueOf<typeof type>;
            const head = timeline.slice(0, 3);
            const tail = timeline.slice(-3);
            const hasRest = timeline.length > 6;
            return (
                <>
                    {head.map((_, index) => {
                        return <div key={index}>{formatTimelineLine(timeline, type, index)}</div>;
                    })}
                    {hasRest && <div>...</div>}
                    {tail.map((_, index) => {
                        return (
                            <div key={timeline.length - 3 + index}>
                                {formatTimelineLine(timeline, type, timeline.length - 3 + index)}
                            </div>
                        );
                    })}
                </>
            );
        }
        if (Types.utils.isList(type)) {
            return (value as ValueOf<typeof type>).join(", ");
        }
        if (Types.utils.isStruct(type)) {
            return Object.entries(type.fields).map(([key, fieldType]) => (
                <div key={key}>{`${key}: ${formatTableCell((value as ValueOf<typeof type>)[key], fieldType)}`}</div>
            ));
        }
        return value.toString();
    }

    function formatTimelineLine<T extends IType>(value: ValueOf<T>, type: T, index: number) {
        if (!Types.utils.isTimeline(type)) return null;
        const entry = (value as ValueOf<typeof type>)[index];
        if (!entry) return null;
        return (
            <div key={index}>
                {entry.timestamp && DateTime.fromISO(entry.timestamp).setLocale("de-DE").toLocaleString()}
                {entry.start && `${DateTime.fromISO(entry.start).setLocale("de-DE").toLocaleString()} - ${DateTime.fromISO(entry.end).setLocale("de-DE").toLocaleString()}`}: {entry.type}
                {Object.keys(Types.utils.customFields(entry)).length > 0 && (
                    <span>
                        {" "}
                        (
                        {Object.entries(Types.utils.customFields(entry))
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")}
                        )
                    </span>
                )}
            </div>
        );
    }

    const renderTableHeader = () => (
        <thead className="text-xs text-gray-700 bg-gray-100">
            <tr>
                {dataTable.getColumns(showIndex).map((col, colIndex) => (
                    <th key={`h_${colIndex}`} className="px-2 py-2 whitespace-nowrap font-medium">
                        {col.name === DataTable.indexColumnName_ ? "#" : col.name}
                    </th>
                ))}
            </tr>
        </thead>
    );

    const renderTableBody = () => (
        <tbody>
            {dataTable.getRows().length === 0 && (
                <tr>
                    <td colSpan={dataTable.getColumns(showIndex).length} className="text-center py-5 border-b">
                        No data available
                    </td>
                </tr>
            )}
            {dataTable.getColumn(0) &&
                dataTable
                    .getColumn(0)!
                    .values.slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                    .map((_, rowIndex) => (
                        <tr
                            key={page * rowsPerPage + rowIndex}
                            className={`border-b ${
                                highlightedRows?.includes(rowIndex)
                                    ? "bg-green-100 border-green-200"
                                    : "bg-white"
                            }`}
                        >
                            {dataTable.getColumns(showIndex).map((col, colIndex) => (
                                <td key={`${rowIndex}_${colIndex}`} className="px-2 py-1 whitespace-nowrap align-top">
                                    {formatTableCell(col.values[page * rowsPerPage + rowIndex], col.type)}
                                </td>
                            ))}
                        </tr>
                    ))}
        </tbody>
    );

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table {...rest} className="overflow-hidden text-sm text-left text-gray-500 table-auto min-w-full">
                {header !== false ? renderTableHeader() : children}
                {renderTableBody()}
            </table>
        </div>
    );
}

export function TableHeader(props: React.HTMLProps<HTMLTableSectionElement>) {
    return <thead {...props}>{props.children}</thead>;
}
