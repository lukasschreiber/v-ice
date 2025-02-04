import { DataTable, IndexedDataRow } from "./table";

export class FilteredDataTable {
    private originalTable: DataTable;
    private filteredIndices: number[];

    constructor(originalTable: DataTable, filteredIndices: number[]) {
        this.originalTable = originalTable;
        this.filteredIndices = filteredIndices;
    }

    public getRow(index: number): IndexedDataRow | null {
        if (!this.filteredIndices.includes(index)) {
            throw new Error("Accessing row outside of filtered set");
        }
        return this.originalTable.getRow(index);
    }
}
