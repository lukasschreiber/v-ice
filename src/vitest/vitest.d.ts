import { ColumnType, DataColumn, DataRow, DataTable } from "@/data/table"

interface ExtendedMatchers<R = unknown> {
    toEqualRows(expectedRows: DataRow[]): R
    toEqualColumns(columns: DataColumn<ColumnType>[]): R
    toBeUnique(): R
}

declare module 'vitest' {
    interface Assertion<T = DataTable> extends ExtendedMatchers<T> { }
    interface AsymmetricMatchersContaining extends ExtendedMatchers { }
}