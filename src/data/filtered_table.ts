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

    getColumns(showIndex: boolean): DataColumn<ColumnType>[] {
        return this.originalTable.getColumns(showIndex).map((column) => {
            const newColumn = column.clone();
            newColumn.values = newColumn.values.filter((_, i) => this.filteredIndices.includes(i));
            return newColumn;
        });
    }

    getColumn(index: number): DataColumn<ColumnType> | null {
        const newColumn = this.originalTable.getColumn(index)?.clone();
        if (!newColumn) {
            return null;
        }

        newColumn.values = newColumn.values.filter((_, i) => this.filteredIndices.includes(i));
        return newColumn;
    }

    getColumnByName(name: string): DataColumn<ColumnType> | null {
        const column = this.originalTable.getColumnByName(name);
        if (!column) {
            return null;
        }

        const newColumn = column.clone();
        newColumn.values = newColumn.values.filter((_, i) => this.filteredIndices.includes(i));
        return newColumn;
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