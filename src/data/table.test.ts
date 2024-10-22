import { expect, test, beforeEach } from "vitest"
import { DataColumn, DataTable, DataRow, ColumnTypes, ColumnType } from "@/data/table"
import titanicCsv from "@/assets/data/titanic.csv?raw"
import extendedTitanicCsv from "@/assets/data/titanic_extended.csv?raw"
import { findNonSerializableValue } from "@reduxjs/toolkit"
import t from "./types"

let referenceColumns: DataColumn<ColumnType>[] = []
let referenceRows: DataRow[] = []

beforeEach(() => {
    t.registry.registerEnum("D", {columns: ["D"]})
    t.registry.registerEnum("E", {columns: ["E"]})

    referenceColumns = [
        new DataColumn("A", t.number, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        new DataColumn("B", t.number, [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]),
        new DataColumn("C", t.boolean, [true, false, true, false, true, false, true, false, true, false]),
        new DataColumn("D", t.enum("D"), ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]),
        new DataColumn("E", t.enum("E"), ["J", "I", "H", "G", "F", "E", "D", "C", "B", "A"]),
    ]

    referenceRows = referenceColumns[0].values.map((_, i) => {
        return referenceColumns.reduce((acc, column) => {
            acc[column.name] = column.values[i]
            return acc
        }, {} as DataRow)
    })
    referenceRows.map((row, i) => row[DataTable.indexColumnName_] = i)
})

test("DataTable creation from a list of columns", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(table).toEqualColumns(referenceColumns)
    expect(table.getIndexColumn()).toBeUnique()

    // adding a row should yield an index that is one higher than the previous one
    table.addRow(referenceRows[0])
    expect(table.getRow(10)![DataTable.indexColumnName_]).toEqual(10)
})

test("DataTable creation from a list of rows", () => {
    const table = DataTable.fromRows(referenceRows)
    expect(table).toEqualRows(referenceRows)
    expect(table.getIndexColumn()).toBeUnique()

    // adding a row should yield an index that is one higher than the previous one
    table.addRow(referenceRows[0])
    expect(table.getRow(10)![DataTable.indexColumnName_]).toEqual(10)
})

test("DataTable creation from a list of rows with and w/o index column", () => {
    // the reference rows should have an index column
    expect(referenceRows[0][DataTable.indexColumnName_]).toBe(0)
    const table = DataTable.fromRows(referenceRows)
    expect(table).toEqualRows(referenceRows)
    expect(table.getIndexColumn()).toBeUnique()
    expect(table.getIndexColumn().values).toEqual(referenceRows.map(row => row[DataTable.indexColumnName_]))

    // the rows should be the same if the index column is removed
    const rowsWithoutIndex = referenceRows.map(row => {
        const newRow = { ...row }
        delete newRow[DataTable.indexColumnName_]
        return newRow
    })
    const tableWithoutIndex = DataTable.fromRows(rowsWithoutIndex, table.getColumnTypes(), table.getColumnNames())
    expect(tableWithoutIndex).toEqualRows(referenceRows)
    expect(tableWithoutIndex.getIndexColumn()).toBeUnique()
    expect(tableWithoutIndex.getIndexColumn().values).toEqual(referenceRows.map(row => row[DataTable.indexColumnName_]))
})

test("DataTable creation from a list of rows with inferred types", () => {
    expect(DataTable.fromRows(referenceRows)).toEqualColumns(referenceColumns)
})

test("DataTable creation from a list of rows with explicit types", () => {
    const columnTypes = referenceColumns.map(column => column.type)
    expect(DataTable.fromRows(referenceRows, columnTypes)).toEqualColumns(referenceColumns)
})

test("DataTable creation from a list of rows with explicit types and inferred types", () => {
    const columnTypes: ColumnTypes = referenceColumns.map(column => column.type)
    for (let i = 0; i < columnTypes.length; i++) {
        const testColumnTypes = [...columnTypes]
        testColumnTypes[i] = "infer"
        expect(DataTable.fromRows(referenceRows, testColumnTypes)).toEqualColumns(referenceColumns)
    }
})

test("Get row by index", () => {
    const table = DataTable.fromColumns(referenceColumns)
    for (let i = 0; i < referenceRows.length; i++) {
        expect(table.getRow(i)).toEqual(referenceRows[i])
    }
})

test("Get rows", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(table.getRows()).toEqual(referenceRows)
})

test("Get value by row and column index", () => {
    const table = DataTable.fromColumns(referenceColumns)
    for (let i = 0; i < referenceRows.length; i++) {
        for (let j = 0; j < referenceColumns.length; j++) {
            expect(table.getValue(i, j)).toEqual(referenceRows[i][referenceColumns[j].name])
        }
    }
})

test("Get row count", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(table.getRowCount()).toEqual(referenceRows.length)
})

test("Get column count", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(table.getColumnCount()).toEqual(referenceColumns.length)
})

test("Get column by name", () => {
    const table = DataTable.fromColumns(referenceColumns)
    for (let i = 0; i < referenceColumns.length; i++) {
        expect(table.getColumnByName(referenceColumns[i].name)).toEqual(referenceColumns[i])
    }
})

test("Get columns", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(table.getColumns()).toEqual(referenceColumns)
})

test("Get column", () => {
    const table = DataTable.fromColumns(referenceColumns)
    for (let i = 0; i < referenceColumns.length; i++) {
        expect(table.getColumn(i)).toEqual(referenceColumns[i])
    }
})

test("Remove column by index", () => {
    const table = DataTable.fromColumns(referenceColumns)
    table.removeColumn(0)
    expect(table.getColumns()).toEqual(referenceColumns.slice(1))
    expect(table.getRowCount()).toEqual(referenceRows.length)
})

test("Remove row by index", () => {
    const table = DataTable.fromColumns(referenceColumns)
    table.removeRow(0)
    expect(table.getRows()).toEqual(referenceRows.slice(1))
    expect(table.getColumnCount()).toEqual(referenceColumns.length)
    expect(table.getIndexColumn()).toBeUnique()
})

test("Get Column Types", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(table.getColumnTypes()).toEqual(referenceColumns.map(column => column.type))
})

test("Get Column Names", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(table.getColumnNames()).toEqual(referenceColumns.map(column => column.name))
})

test("Clear table (all metadata should be left intact)", () => {
    const table = DataTable.fromColumns(referenceColumns)
    table.clear()
    expect(table.getRows()).toEqual([])
    expect(table.getColumns()).toEqual(referenceColumns.map(column => new DataColumn(column.name, column.type, [])))
    expect(table.getRowCount()).toEqual(0)
    expect(table.getColumnCount()).toEqual(referenceColumns.length)
    expect(table.getColumnTypes()).toEqual(referenceColumns.map(column => column.type))
    expect(table.getColumnNames()).toEqual(referenceColumns.map(column => column.name))
    expect(table.getIndexColumn().values).toEqual([])

    table.addRow(referenceRows[0])
    expect(table.getRow(0)![DataTable.indexColumnName_]).toEqual(0)
})

test("Clone table", () => {
    const table = DataTable.fromColumns(referenceColumns)
    const clonedTable = table.clone()
    expect(clonedTable).toEqualColumns(referenceColumns)
    expect(clonedTable).not.toBe(table)
    expect(clonedTable.getColumns()).not.toBe(table.getColumns())
    expect(clonedTable.getRows()).not.toBe(table.getRows())
    expect(clonedTable.getIndexColumn()).not.toBe(table.getIndexColumn())
    expect(clonedTable.getIndexColumn().values).toEqual(table.getIndexColumn().values)
})

test("Create empty table", () => {
    const table = DataTable.empty()
    expect(table.getRows()).toEqual([])
    expect(table.getColumns()).toEqual([])
    expect(table.getRowCount()).toEqual(0)
    expect(table.getColumnCount()).toEqual(0)

    // empty table should start with index 0
    table.addColumn(new DataColumn("A", t.number, []))
    table.addRow({ A: 1 })
    expect(table.getRow(0)![DataTable.indexColumnName_]).toEqual(0)
})

test("Adding a column to an empty table should add an index column", () => {
    const table = DataTable.empty()
    table.addColumn(new DataColumn("A", t.number, [1, 2, 3, 4, 5]))
    expect(table.getColumnNames()).toEqual(["A"])
    expect(table.getColumnTypes()).toEqual([t.number])
    expect(table.getRowCount()).toEqual(5)
    expect(table.getIndexColumn().values).toEqual([0, 1, 2, 3, 4])
})

test("All functions should behave correctly on an empty table", () => {
    const table = DataTable.empty()
    expect(table.getRows()).toEqual([])
    expect(table.getColumns()).toEqual([])
    expect(table.getRowCount()).toEqual(0)
    expect(table.getColumnCount()).toEqual(0)
    expect(table.getRow(0)).toEqual(null)
    expect(table.getColumn(0)).toEqual(null)
    expect(() => table.removeColumn(0)).toThrowError()
    expect(() => table.removeRow(0)).toThrowError()
    expect(table.getValue(0, 0)).toEqual(null)
    expect(table.getColumnByName("A")).toEqual(null)
    expect(table.getColumnTypes()).toEqual([])
    expect(table.clone()).toEqualColumns([])
    table.clear()
    expect(table.getIndexColumn().values).toEqual([])
    expect(table.getRows()).toEqual([])
    expect(table.getColumns()).toEqual([])
    expect(table.getRowCount()).toEqual(0)
    expect(table.getColumnCount()).toEqual(0)
    expect(() => table.sort("A")).toThrowError()
    expect(() => table.sort(["A", "B"])).toThrowError()
    expect(() => table.sort(() => 0)).not.toThrowError()
    // after sorting with a custom comparator, the table should still be empty
    expect(table).toEqualColumns([])
})

test("fromRows should work with empty rows", () => {
    expect(() => DataTable.fromRows([])).toThrowError()
    expect(() => DataTable.fromRows([], "infer")).toThrowError()
    expect(() => DataTable.fromRows([], [t.number, t.boolean, "infer"])).toThrowError()
    const table = DataTable.fromRows([], referenceColumns.map(column => column.type), referenceColumns.map(column => column.name))
    expect(table.getRows()).toEqual([])
    expect(table.getColumns()).toEqual(referenceColumns.map(column => new DataColumn(column.name, column.type, [])))
})

test("Create DataTable from CSV", async () => {
    const file = new File([titanicCsv], "titanic.csv")
    const types: ColumnTypes = [t.number, t.boolean, t.number, t.enum("Name"), t.enum("Sex"), t.number, t.number, t.number, t.enum("Ticket"), t.number, t.enum("Cabin"), t.enum("Embarked")]
    const names = ["PassengerId", "Survived", "Pclass", "Name", "Sex", "Age", "SibSp", "Parch", "Ticket", "Fare", "Cabin", "Embarked"]
    const table = await DataTable.fromCSV(file, { columnTypes: types })
    expect(table.getColumnNames()).toEqual(names)
    expect(table.getRowCount()).toEqual(891)
    expect(table.getColumnTypes()).toEqual(types)
    expect(table.getValue(0, 0)).toEqual(1)
    expect(table.getValue(0, 1)).toEqual(false)
    expect(table.getValue(0, 2)).toEqual(3)
    expect(table.getValue(0, 3)).toEqual("Braund, Mr. Owen Harris")
})

test("Create DataTable form CSV with Boolean type", async () => {
    const file = new File([extendedTitanicCsv], "extended_titanic.csv")
    const names = ["PassengerId", "Survived", "Pclass", "Name", "Sex", "Age", "SibSp", "Parch", "Ticket", "Fare", "Cabin", "Embarked", "WikiId", "Name_wiki", "Age_wiki", "Hometown", "Boarded", "Destination", "Lifeboat", "Body", "Class"]
    const types: ColumnTypes = [t.number, t.boolean, t.number, t.enum("Name"), t.enum("Sex"), t.number, t.number, t.number, t.enum("Ticket"), t.number, t.enum("Cabin"), t.enum("Embarked"), t.number, t.enum("Name_wiki"), t.number, t.enum("Hometown"), t.enum("Boarded"), t.enum("Destination"), t.enum("Lifeboat"), t.enum("Body"), t.enum("Class")]
    const table = await DataTable.fromCSV(file, { columnTypes: types })
    expect(table.getColumnNames()).toEqual(names)
    expect(table.getRowCount()).toEqual(1309)
    expect(table.getColumnTypes()).toEqual(types)
    expect(table.getValue(0, 0)).toEqual(1)
    expect(table.getValue(0, 1)).toEqual(false)
    expect(table.getValue(1, 1)).toEqual(true)
    expect(table.getValue(0, 2)).toEqual(3)
    expect(table.getValue(0, 3)).toEqual("Braund, Mr. Owen Harris")
})

test("Create DataTable form CSV with inferred types", async () => {
    const file = new File([extendedTitanicCsv], "extended_titanic.csv")
    const names = ["PassengerId", "Survived", "Pclass", "Name", "Sex", "Age", "SibSp", "Parch", "Ticket", "Fare", "Cabin", "Embarked", "WikiId", "Name_wiki", "Age_wiki", "Hometown", "Boarded", "Destination", "Lifeboat", "Body", "Class"]
    const types: ColumnTypes = [t.number, t.boolean, t.number, t.enum("Name"), t.enum("Sex"), t.number, t.number, t.number, t.enum("Ticket"), t.number, t.enum("Cabin"), t.enum("Embarked"), t.number, t.enum("Name_wiki"), t.number, t.enum("Hometown"), t.enum("Boarded"), t.enum("Destination"), t.enum("Lifeboat"), t.enum("Body"), t.enum("Class")]
    const table = await DataTable.fromCSV(file, { columnTypes: types })
    expect(table.getColumnNames()).toEqual(names)
    expect(table.getRowCount()).toEqual(1309)
    expect(table.getColumnTypes()).toEqual(types)
})

test("Serialize and deserialize DataTable", () => {
    const table = DataTable.fromColumns(referenceColumns)
    const serialized = table.serialize()
    const deserialized = DataTable.deserialize(serialized)
    expect(deserialized).toEqualColumns(referenceColumns)
})

test("Serialized DataTable should be serializable", () => {
    const table = DataTable.fromColumns(referenceColumns)
    const serialized = table.serialize()
    expect(findNonSerializableValue(serialized)).toEqual(false)
})

test("converting to CSV and back yields the same table", async () => {
    const table = DataTable.fromColumns(referenceColumns)
    const csv = table.toCSV()
    const file = new File([csv], "test.csv")
    const newTable = await DataTable.fromCSV(file, { columnTypes: table.getColumnTypes() })
    expect(newTable).toEqualColumns(referenceColumns)
})

test("Sort table by column for enum column", () => {
    
    const table = DataTable.fromColumns(referenceColumns).clone()
    table.sort("E")
    const sortedColumn = referenceColumns[4].values.slice().sort()
    expect(table.getColumnByName("E")!.values).toEqual(sortedColumn)

    // make sure that the other columns are sorted in the same way, so all rows are still correct
    for (const row of table.getRows()) {
        expect(row).toEqual(referenceRows.find(r => r["A"] === row["A"]))
    }
})

test("Sort table by column for enum column descending", () => {
    
    const table = DataTable.fromColumns(referenceColumns).clone()
    table.sort("E", false)
    const sortedColumn = referenceColumns[4].values.slice().sort().reverse()
    expect(table.getColumn(4)!.values).toEqual(sortedColumn)

    // make sure that the other columns are sorted in the same way, so all rows are still correct
    for (const row of table.getRows()) {
        expect(row).toEqual(referenceRows.find(r => r["A"] === row["A"]))
    }
})

test("Sort table by column for number column", () => {
    
    const table = DataTable.fromColumns(referenceColumns).clone()
    table.sort("A")
    const sortedColumn = referenceColumns[0].values.slice().sort((a, b) => (a as number) - (b as number))
    expect(table.getColumn(0)!.values).toEqual(sortedColumn)

    // make sure that the other columns are sorted in the same way, so all rows are still correct
    for (const row of table.getRows()) {
        expect(row).toEqual(referenceRows.find(r => r["A"] === row["A"]))
    }
})

test("Sort table by column for boolean column", () => {
    
    const table = DataTable.fromColumns(referenceColumns).clone()
    table.sort("C")
    const sortedColumn = referenceColumns[2].values.slice().sort()
    expect(table.getColumn(2)!.values).toEqual(sortedColumn)

    // make sure that the other columns are sorted in the same way, so all rows are still correct
    for (const row of table.getRows()) {
        expect(row).toEqual(referenceRows.find(r => r["A"] === row["A"]))
    }
})

test("Sort table by multiple columns if there are duplicates in the first one", () => {
    
    const table = DataTable.fromColumns(referenceColumns).clone()

    // duplicate value in B, C and D, ascending values in E and unique values in A
    table.addRow({ ...referenceRows[0], E: "A", A: 11 })
    table.addRow({ ...referenceRows[0], E: "B", A: 12 })

    const sortedColumnD = table.getColumn(3)!.values.slice().sort()
    const referenceRowsClone = table.clone().getRows()

    table.sort(["D", "E"])

    expect(table.getColumn(3)!.values).toEqual(sortedColumnD)
    expect(table.getValue(0, 4)).toEqual("A")
    expect(table.getValue(1, 4)).toEqual("B")
    expect(table.getValue(2, 4)).toEqual("J")

    for (const row of table.getRows()) {
        expect(row).toEqual(referenceRowsClone.find(r => r["A"] === row["A"]))
    }
})

test("Sort table by multiple columns if there are duplicates in the first one descending", () => {
    
    const table = DataTable.fromColumns(referenceColumns).clone()

    // duplicate value in B, C and D, ascending values in E and unique values in A
    table.addRow({ ...referenceRows[0], E: "A", A: 11 })
    table.addRow({ ...referenceRows[0], E: "B", A: 12 })

    const sortedColumnD = table.getColumn(3)!.values.slice().sort().reverse()
    const referenceRowsClone = table.clone().getRows()

    table.sort(["D", "E"], false)

    expect(table.getColumn(3)!.values).toEqual(sortedColumnD)
    const size = table.getRowCount()
    expect(table.getValue(size - 3, 4)).toEqual("J")
    expect(table.getValue(size - 2, 4)).toEqual("B")
    expect(table.getValue(size - 1, 4)).toEqual("A")

    for (const row of table.getRows()) {
        expect(row).toEqual(referenceRowsClone.find(r => r["A"] === row["A"]))
    }
})

test("Sorting table by multiple columns should behave the same as sorting by one column if only one is provided", () => {
    const table1 = DataTable.fromColumns(referenceColumns).clone()
    const table2 = DataTable.fromColumns(referenceColumns).clone()

    table1.sort("B")
    table2.sort(["B"])


    expect(table1).toEqualColumns(table2.getColumns())
    expect(table1).toEqualRows(table2.getRows())
})

test("Sorting table with a custom comparator", () => {
    
    const table = DataTable.fromColumns(referenceColumns).clone()
    table.sort((a, b) => (a["A"] as number) - (b["A"] as number))
    const sortedColumn = referenceColumns[0].values.slice().sort((a, b) => (a as number) - (b as number))
    expect(table.getColumn(0)!.values).toEqual(sortedColumn)

    for (const row of table.getRows()) {
        expect(row).toEqual(referenceRows.find(r => r["A"] === row["A"]))
    }
})

test("It should not be possible to add a column with a different length than the table", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(() => table.addColumn(new DataColumn("X", t.number, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]))).toThrowError()
})

test("It should not be possible to add a row with a different length than the table", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(() => table.addRow({ A: 1, B: 2, C: 3 })).toThrowError()
})

test("It should not be possible to add a row with a different column than the table", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(() => table.addRow({ A: 1, B: 2, C: 3, X: 4 })).toThrowError()
})

test("It should not be possible to add a row with a different type than the table", () => {
    const table = DataTable.fromColumns(referenceColumns)
    expect(() => table.addRow({ A: "1", B: 2, C: 3, D: "4", E: "5" })).toThrowError()
})

test("A table that has been loaded from JSON should have an index column", () => {
    const table = DataTable.fromColumns(referenceColumns)
    const serialized = table.toJSON()
    // remove the index column
    serialized.table = serialized.table.filter(col => col.name !== DataTable.indexColumnName_)
    const deserialized = DataTable.fromJSON(serialized)
    expect(deserialized.getIndexColumn()).toBeUnique()
})