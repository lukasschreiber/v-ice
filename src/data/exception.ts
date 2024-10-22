import { ColumnType, DataColumn } from "./table";

export class InvalidColumnValueAddedError extends Error {
    constructor(column: DataColumn<ColumnType>, value: unknown, reason?: string) {
        const valueString = JSON.stringify(value)
        super(`Column ${column.name} has type ${column.type.name}. The provided value ${valueString.slice(0, 200)}${valueString.length > 200 ? "..." : ""} is not of type ${column.type.name}.${reason ? ` ${reason}` : ""}`)
    }
}