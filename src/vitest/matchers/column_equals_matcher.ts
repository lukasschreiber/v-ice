import { ColumnType, DataColumn, DataTable } from "@/data/table";
import { MatcherState } from "@vitest/expect";

export function toEqualColumns(this: MatcherState, received: DataTable, columns: DataColumn<ColumnType>[]) {
    const receivedColumns = [];

    for (let i = 0; i < received.getColumnCount(); i++) {
        const column = received.getColumn(i)!
        receivedColumns.push({
            name: column.name,
            type: column.type,
            values: column.values
        });
    }

    const pass = this.equals(receivedColumns, columns);

    if (pass) {
        return {
            message: () =>
                `expected DataTable columns not to equal expected columns`,
            pass: true,
        };
    } else {
        return {
            message: () => `expected DataTable columns to equal expected columns`,
            pass: false,
        };
    }
}