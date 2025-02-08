import { DataTable, IndexedDataRow, DataTableRead, ColumnType, DataColumn } from "./table";
import { ValueOf, INumberType } from "./types";

export interface NormalizedFitleredDataTable {
    indices: number[];
}

export class FilteredDataTable implements DataTableRead {
    private originalTable: DataTable;
    private filteredIndices: number[];

    constructor(originalTable: DataTable, filteredIndices: number[]) {
        this.originalTable = originalTable;
        this.filteredIndices = filteredIndices;
    }

    getColumns(): DataColumn<ColumnType>[] {
        return this.originalTable.getColumns();
    }

    getColumn(index: number): DataColumn<ColumnType> | null {
        return this.originalTable.getColumn(index);
    }

    getColumnByName(name: string): DataColumn<ColumnType> | null {
        return this.originalTable.getColumnByName(name);
    }

    getRow(index: number): IndexedDataRow | null {
        if (!this.filteredIndices.includes(index)) {
            throw new Error("Accessing row outside of filtered set");
        }
        return this.originalTable.getRow(index);
    }

    getRows(): IndexedDataRow[] {
        return this.filteredIndices.map(index => this.originalTable.getRow(index)).filter(row => row !== null) as IndexedDataRow[];
    }

    getValue(row: number, column: number): ValueOf<ColumnType> {
        if (!this.filteredIndices.includes(row)) {
            throw new Error("Accessing row outside of filtered set");
        }
        return this.originalTable.getValue(row, column);
    }

    getRowCount(): number {
        return this.filteredIndices.length;
    }

    getColumnCount(): number {
        return this.originalTable.getColumnCount();
    }

    getColumnTypes(): ColumnType[] {
        return this.originalTable.getColumnTypes();
    }

    getColumnNames(): string[] {
        return this.originalTable.getColumnNames();
    }

    getIndexColumn(): DataColumn<INumberType> {
        return this.originalTable.getIndexColumn();
    }

    toNormalizedTable(): NormalizedFitleredDataTable {
        return { indices: this.filteredIndices };
    }

    static fromNormalizedTable(table: DataTable, normalized: NormalizedFitleredDataTable): FilteredDataTable {
        return new FilteredDataTable(table, normalized.indices);
    }
}