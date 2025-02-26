import { DataRow, DataTable } from "@/data/table";
import { MatcherState } from "@vitest/expect";

export function toEqualRows(this: MatcherState, received: DataTable, expectedRows: DataRow[]) {
    const receivedRows = [];
    expectedRows = expectedRows.map(row => {
        const newRow = { ...row };
        delete newRow[DataTable.indexColumnName_];
        return newRow;
    });


    for (let i = 0; i < received.getRowCount(); i++) {
        const row = {} as DataRow;
        for (let j = 0; j < received.getColumnCount(); j++) {
            row[received.getColumn(j)!.name] = received.getValue(i, j)!;
        }
        receivedRows.push(row);
    }

    const pass = this.equals(receivedRows, expectedRows);

    if (pass) {
        return {
            message: () =>
                `expected DataTable rows not to equal expected rows`,
            pass: true,
        };
    } else {
        return {
            message: () => `expected DataTable rows to equal expected rows`,
            pass: false,
        };
    }
}