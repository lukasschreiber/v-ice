import { IBooleanType, IEnumType, IHierarchyType, IListType, INullableType, INumberType, IStringType, IStructType, ITimestampType, IType, StructFields, ValueOf } from "./types";
import t from "./types";
import { TypeChecker } from "./type_checker";
import { TypeConverter } from "./type_converter";
import { TypePredictor } from "./type_predictor";
import { InvalidColumnValueAddedError } from "./exception";
import { IHierarchyDefinition } from "./hierarchy";
import { EnumDefinition } from "./type_registry";

export interface NormalizedDataTable {
    columns: {name: string, type: IType}[];
    rows: Record<string, ValueOf<ColumnType>>[];
    index: number[];
}

export type SerializedColumn<T extends ColumnType> = { name: string, type: string, values: ValueOf<T>[] }
export type SerializedTable = SerializedColumn<ColumnType>[]
export type DataRow = Record<string, ValueOf<ColumnType>>
export type IndexedDataRow = DataRow & { [DataTable.indexColumnName_]: number }
type ValidColumnTypes = IEnumType | IHierarchyType | INumberType | IBooleanType | IStringType | ITimestampType | IListType<IType> | IStructType<StructFields> | IType
export type ColumnType = ValidColumnTypes | INullableType<ValidColumnTypes>
export type ColumnTypes = (ColumnType | "infer")[] | "infer"

export type TableSaveFile = {
    meta?: {
        hierarchies?: Record<string, IHierarchyDefinition>
        enums?: Record<string, EnumDefinition>
    },
    table: SerializedTable
}

export interface CsvOptions {
    delimiter: string
    newLine: string
    header: boolean
    columnTypes: ColumnTypes
    columnNames: string[]
    encoding: string
}


/**
 * Represents a column of data with a name, type and a list of values.
 * The values in the column must be of the specified type.
 */
export class DataColumn<T extends ColumnType> {
    name: string;
    type: T;
    values: ValueOf<T>[];

    /**
     * Creates a new DataColumn.
     * @param name The name of the column
     * @param type The type of the column
     * @param values The values in the column, must be of the specified type
     */
    constructor(name: string, type: T, values: ValueOf<T>[]) {
        this.name = name;
        this.type = type;
        this.values = values;
    }

    /**
     * Serialize the DataColumn to a JSON object.
     * @returns A JSON object representing the DataColumn
     */
    serialize(): SerializedColumn<T> {
        return { name: this.name, type: this.type.name, values: this.values }
    }

    /**
     * Create a deep copy of the DataColumn.
     * @returns A deep copy of the DataColumn
     */
    clone(): DataColumn<T> {
        return new DataColumn(this.name, this.type, [...this.values]);
    }

    static deserialize<T extends ColumnType>(column: SerializedColumn<T>): DataColumn<T> {
        return new DataColumn(column.name, t.utils.fromString(column.type) as T, column.values)
    }
}

/**
 * Represents a table of data with columns and rows.
 * Internally, the data is stored as a list of columns, each with a name, type and a list of values.
 * 
 * The table can be created from a list of columns or a list of rows.
 * When created from a list of rows, the column types can be inferred or explicitly provided.
 */
export class DataTable {
    static readonly indexColumnName_ = "index_" // reserved column name for the index column
    private nextIndex = 0
    protected columns_: DataColumn<ColumnType>[] = [];
    protected index_: DataColumn<INumberType> = new DataColumn(DataTable.indexColumnName_, t.number, [])


    /**
     * Creates a new DataTable.
     * @param columns List of columns to initialize the table with
     */
    constructor(columns: DataColumn<ColumnType>[] = []) {
        for (const column of columns) {
            for (const value of column.values) {
                const { valid, reason } = TypeChecker.checkTypeWithReason(column.type, value)
                if (!valid) {
                    throw new InvalidColumnValueAddedError(column, value, reason)
                }
            }
        }
        this.columns_ = columns.filter(col => col.name !== DataTable.indexColumnName_)
        const indexColumn = columns.find(col => col.name === DataTable.indexColumnName_ && t.utils.isNumber(col.type))
        if (indexColumn) {
            this.index_ = indexColumn as DataColumn<INumberType>
        } else {
            this.index_.values = columns.length > 0 ? Array.from({ length: columns[0].values.length }, (_, i) => i) : []
        }
        this.nextIndex = this.index_.values.length === 0 ? 0 : Math.max(...this.index_.values) + 1
    }

    /**
     * Get the columns in the table.
     * @returns List of columns in the table
     */
    getColumns(opt_includeIndex: boolean | undefined = false): DataColumn<ColumnType>[] {
        if (opt_includeIndex) {
            return [this.index_, ...this.columns_]
        }
        return this.columns_;
    }

    /**
     * Get a column by index.
     * @param index Index of the column to get
     * @returns The column at the specified index or null if it does not exist
     */
    getColumn(index: number) {
        if (index >= 0 && index < this.columns_.length)
            return this.columns_[index];
        else
            return null;
    }

    /**
     * Get a column by name.
     * @param name Name of the column to get
     * @returns The column with the specified name or null if it does not exist
     */
    getColumnByName(name: string) {
        return this.columns_.find(column => column.name === name) ?? null;
    }

    /**
     * Add a column to the table.
     * @param column Column to add
     */
    addColumn(column: DataColumn<ColumnType>) {
        if (column.name !== DataTable.indexColumnName_) {
            if (this.columns_.length > 0 && column.values.length !== this.index_.values.length) {
                throw new Error(`Column ${column.name} has a different number of values than the rest of the columns`)
            }

            if (column.values.some(value => !TypeChecker.checkType(column.type, value))) {
                throw new Error(`Values in column ${column.name} do not match the specified type ${column.type.name}`)
            }

            this.columns_.push(column);

            // we need to update the index column if the new column has more values, this should only happen when adding a new column to an empty table
            if (this.index_.values.length < column.values.length) {
                for (let i = this.index_.values.length; i < column.values.length; i++) {
                    this.index_.values.push(this.getNextFreeIndex())
                }
            }
        } else {
            throw new Error(`Column name ${DataTable.indexColumnName_} is reserved`)
        }
    }

    /**
     * Remove a column by index.
     * @param index Index of the column to Remove
     * @throws Error if the index is out of bounds
     */
    removeColumn(index: number) {
        if (index >= 0 && index < this.columns_.length) {
            this.columns_.splice(index, 1);
        } else {
            throw new Error(`Index ${index} out of bounds`);
        }
    }

    /**
     * Add a row to the table.
     * @param row Row to add
     * @throws Error if the row does not contain a value for each column
     */
    addRow(row: DataRow) {
        this.columns_.forEach(column => {
            if (column.name in row) {
                if (TypeChecker.checkType(column.type, row[column.name])) {
                    column.values.push(row[column.name]);
                } else {
                    throw new Error(`Value ${row[column.name]} is not of type ${column.type.name} in column ${column.name}`);
                }
            } else {
                throw new Error(`Column ${column.name} not found in row`);
            }
        });
        // TODO: add custom index but check for uniqueness
        this.index_.values.push(this.getNextFreeIndex())
    }

    /**
     * Remove a row by index.
     * @param index Index of the row to remove
     * @throws Error if the index is out of bounds
     */
    removeRow(index: number) {
        if (index >= 0 && index < this.columns_[0]?.values.length) {
            this.columns_.forEach(column => column.values.splice(index, 1));
            this.index_.values.splice(index, 1)
        } else {
            throw new Error(`Index ${index} out of bounds`);
        }
    }

    /**
     * Get a row by index.
     * @param index Index of the row to get
     * @returns The row at the specified index or null if it does not exist
     */
    getRow(index: number): IndexedDataRow | null {
        if (index >= 0 && index < this.columns_[0]?.values.length) {
            return {
                [DataTable.indexColumnName_]: this.index_.values[index],
                ...this.columns_.reduce((acc, column) => {
                    acc[column.name] = column.values[index];
                    return acc;
                }, {} as DataRow)
            };
        } else {
            return null;
        }
    }

    /**
     * Get a row index.
     * @param index Index of the row to get
     * @returns The internal index at the specified positional row index 
     */
    getRowIndex(index: number): number | null {
        if (index >= 0 && index < this.columns_[0]?.values.length) {
            return this.index_.values[index]
        } else {
            return null;
        }
    }

    /**
     * Get all rows in the table.
     * @returns List of rows in the table
     */
    getRows(): IndexedDataRow[] {
        return (this.columns_[0]?.values.map((_, i) => this.getRow(i)).filter(row => row !== null) ?? []) as IndexedDataRow[];
    }

    /**
     * Get the value at the specified row and column index.
     * @param row Index of the row
     * @param column Index of the column
     * @returns The value at the specified row and column index or null if it does not exist
     */
    getValue(row: number, column: number) {
        if (row >= 0 && row < this.getRowCount() && column >= 0 && column < this.getColumnCount())
            return this.columns_[column].values[row];
        else
            return null;
    }

    /**
     * Clear all rows in the table.
     */
    clear() {
        this.columns_.forEach(column => column.values = []);
        this.index_.values = []
        this.nextIndex = 0
    }

    /**
     * Get the number of rows in the table.
     * @returns The number of rows in the table
     */
    getRowCount() {
        return this.columns_[0]?.values.length ?? 0;
    }

    /**
     * Get the number of columns in the table.
     * @returns The number of columns in the table
     */
    getColumnCount() {
        return this.columns_.length;
    }

    /**
     * Get the types of the columns in the table.
     * @returns List of column types in the table
     */
    getColumnTypes(): ColumnType[] {
        return this.columns_.map(column => column.type);
    }

    /**
     * Set the types of the columns in the table.
     * Converts all existing values in this column to the new type.
     * 
     * @param types List of column types to set
     */
    setColumnTypes(types: (ColumnType | undefined)[]) {
        this.columns_.forEach((column, i) => {
            const type = types[i];
            if (type !== undefined) {
                column.type = type
                column.values = column.values.map(value => TypeConverter.toType(value, type))
            }
        });
    }

    /**
     * Get the names of the columns in the table.
     * @returns List of column names in the table
     */
    getColumnNames(): string[] {
        return this.columns_.map(column => column.name);
    }

    /**
     * Set the names of the columns in the table.
     * @param names List of column names to set
     */
    setColumnNames(names: (string | undefined)[]) {
        if (names.includes(DataTable.indexColumnName_)) throw new Error(`Column name ${DataTable.indexColumnName_} is reserved`)
        this.columns_.forEach((column, i) => {
            const name = names[i];
            if (name !== undefined) column.name = name
        });
    }

    getIndexColumn() {
        return this.index_;
    }

    /**
     * Serialize the DataTable to a JSON object.
     * @returns A list of JSON objects representing the DataTable
     */
    serialize(): SerializedTable {
        return [this.index_.serialize(), ...this.columns_.map(col => col.serialize())]
    }

    toNormalizedTable(): NormalizedDataTable {
        const names = this.getColumnNames();
        const types = this.getColumnTypes();
        return {
            columns: names.map((name, i) => ({ name, type: types[i] })),
            index: this.getIndexColumn().values,
            rows: this.getRows()
        }
    }

    private getAllInstancesOfType<T>(checker: (type: IType) => boolean): T[] {
        const instances: T[] = [];

        const findInstances = (type: IType) => {
            if (checker(type)) {
                instances.push(type as T);
            }

            if (t.utils.isList(type)) {
                findInstances(type.elementType);
            }

            if (t.utils.isStruct(type)) {
                Object.values(type.fields).forEach(findInstances);
            }

            if (t.utils.isUnion(type)) {
                type.types.forEach(findInstances);
            }
        };

        this.columns_.forEach(column => {
            findInstances(column.type);
        });

        return instances;
    }

    /**
     * Serialize the DataTable to a JSON object with the used hierarchies in the columns.
     * This function should only be used if you need to save the table to a file and want to include the used hierarchies.
     * 
     * @returns A JSON object representing the DataTable with the used hierarchies in the columns
     */
    toJSON(): TableSaveFile {
        const usedHierarchyNames = this.getAllInstancesOfType<IHierarchyType>(t.utils.isHierarchy).map(hierarchy => hierarchy.hierarchy)
        const usedEnumNames = this.getAllInstancesOfType<IEnumType>(t.utils.isEnum).map(enumType => enumType.enumName)

        return {
            meta: {
                hierarchies: Array.from(usedHierarchyNames).reduce((acc, hierarchyName) => {
                    const hierarchy = t.registry.getHierarchy(hierarchyName)
                    if (hierarchy) {
                        acc[hierarchyName] = hierarchy.getHierarchyDefinition()
                    }
                    return acc
                }, {} as Record<string, IHierarchyDefinition>),
                enums: Array.from(usedEnumNames).reduce((acc, enumName) => {
                    const enumDef = t.registry.getEnum(enumName)
                    if (enumDef) {
                        acc[enumName] = enumDef
                    }
                    return acc
                }, {} as Record<string, EnumDefinition>)
            },
            table: this.serialize()
        }
    }

    private getNextFreeIndex() {
        return this.nextIndex++
    }

    /**
     * Create a deep copy of the DataTable.
     * @returns A deep copy of the DataTable
     */
    clone(): DataTable {
        return DataTable.fromColumns([this.index_.clone(), ...this.getColumns().map(column => column.clone())])
    }

    cloneStructure(): DataTable {
        return DataTable.fromColumns(this.getColumns().map(column => new DataColumn(column.name, column.type, [])))
    }

    /**
     * Convert the DataTable to a CSV string.
     * 
     * @param options Options to use when converting the DataTable to a CSV string
     * @returns A CSV string representing the DataTable
     */
    toCSV(options: Partial<CsvOptions> = {}) {
        const options_: CsvOptions = {
            delimiter: ',',
            newLine: '\n',
            header: true,
            columnTypes: "infer",
            columnNames: [],
            encoding: 'utf-8',
            ...options
        }

        const header = [DataTable.indexColumnName_, ...this.getColumnNames()];
        const rows = this.getRows().map((row, i) => header.map(name => name === DataTable.indexColumnName_ ? this.index_.values[i] : row[name]));
        if (options_.header) rows.unshift(header);
        const values = rows.map(row => row.map(value => {
            if (typeof value === 'string' && value.includes(options_.delimiter)) {
                return `"${value.replace(/"/g, '""').replace(options_.newLine, options_.newLine.replace("\\", "\\\\"))}"`;
            } else {
                return value?.toString() ?? "";
            }
        }));

        return values.map(row => row.join(options_.delimiter)).join(options_.newLine);
    }

    /**
     * Sort the rows in the table in place
     * The comparator can be a function that compares two rows
     * @param comparator A function that compares two rows and returns a negative number if a < b, 0 if a == b and a positive number if a > b
     */
    sort(comparator: ((a: DataRow, b: DataRow) => number)): void
    /**
     * Sort the rows in the table in place
     * @param column The name of the column to sort by
     * @param ascending Whether to sort in ascending order, defaults to true
     */
    sort(column: string, ascending?: boolean): void
    /**
     * Sort the rows in the table in place
     * @param columns The names of the columns to sort by. If multiple columns are provided, the rows are sorted by the first column and if the values are equal, by the second column and so on.
     * @param ascending Whether to sort in ascending order, defaults to true
     */
    sort(columns: string[], ascending?: boolean): void
    sort(a: string[] | string | ((a: DataRow, b: DataRow) => number), ascending: boolean = true): void {
        let compFn: ((a: DataRow, b: DataRow) => number) | undefined = undefined;

        if (typeof a === "string") {
            const column = this.getColumnByName(a);
            if (column) {
                compFn = (a: DataRow, b: DataRow) => {
                    const valueA = a[column.name];
                    const valueB = b[column.name];
                    if (valueA === null && valueB === null) return 0
                    if (valueA === null) return ascending ? 1 : -1
                    if (valueB === null) return ascending ? -1 : 1

                    if (valueA < valueB) return ascending ? -1 : 1;
                    if (valueA > valueB) return ascending ? 1 : -1;
                    return 0;
                }

            } else {
                throw new Error(`Column ${a} not found`);
            }
        } else if (Array.isArray(a)) {
            const columns = a.map(columnName => {
                const column = this.getColumnByName(columnName)
                if (!column) throw new Error(`Column ${columnName} not found`);
                return column;
            });

            compFn = (a: DataRow, b: DataRow) => {
                for (const column of columns) {
                    const valueA = a[column.name];
                    const valueB = b[column.name];

                    if (valueA === null && valueB === null) return 0
                    if (valueA === null) return ascending ? 1 : -1
                    if (valueB === null) return ascending ? -1 : 1

                    if (valueA < valueB) return ascending ? -1 : 1;
                    if (valueA > valueB) return ascending ? 1 : -1;
                }
                return 0;
            }
        } else {
            compFn = a;
        }

        if (compFn) {
            const sortedIndices = this.getRows().map((_, i) => i).sort((a, b) => compFn!(this.getRow(a)!, this.getRow(b)!));
            this.columns_.forEach(column => column.values = sortedIndices.map(i => column.values[i]));
            this.index_.values = sortedIndices.map(i => this.index_.values[i]);
        } else {
            throw new Error("Invalid comparator");
        }
    }

    /**
     * Create a DataTable from a list of columns.
     * @param columns List of columns to create the table from
     * @returns A new DataTable with the specified columns
     */
    static fromColumns(columns: DataColumn<ColumnType>[]) {
        return new DataTable([...columns]);
    }

    /**
     * Create a DataTable from a list of rows.
     * 
     * The column types can be inferred or explicitly provided.
     * If the column types are explicitly provided, the length of the list must match the number of columns in the rows.
     * If the column types are inferred, the type of the first row is used to infer the type of the columns.
     * 
     * @param rows List of rows to create the table from
     * @param columnTypes List of column types to use for the table or "infer" to infer the types from the first row
     * @param columnNames List of column names to use for the table, if not provided the keys of the first row are used. This can be left empty if rows are not empty.
     * @returns A new DataTable with the specified rows
     * @throws Error if the column types are explicitly provided and the length does not match the number of columns in the rows
     * @throws Error if the column types are "infer" and the list of rows is empty
     * @throws Error if the column names are provided and the length does not match the number of columns in the rows
     * @throws Error if the column names are not provided and the list of rows is empty
     */
    static fromRows(rows: DataRow[], columnTypes: ColumnTypes = "infer", columnNames?: string[]) {
        const hasIndex = rows.length > 0 && DataTable.indexColumnName_ in rows[0] || columnNames?.includes(DataTable.indexColumnName_);

        if (hasIndex && columnNames && !columnNames?.includes(DataTable.indexColumnName_)) {
            columnNames.unshift(DataTable.indexColumnName_)
        }

        if (rows.length === 0 && (columnTypes === "infer" || columnTypes.includes("infer")))
            throw new Error("Cannot infer column types from an empty list of rows");

        if (columnTypes !== "infer" && rows.length > 0 && ((!hasIndex && Object.keys(rows[0]).length !== columnTypes.length) || (hasIndex && Object.keys(rows[0]).length !== columnTypes.length + 1)))
            throw new Error("The number of column types must match the number of columns in the rows");

        if (columnNames && rows.length > 0 && (Object.keys(rows[0]).length !== columnNames.length))
            throw new Error("The number of column names must match the number of columns in the rows");

        if (!columnNames && rows.length === 0)
            throw new Error("Column names must be provided if rows are empty");

        if (columnNames === undefined && rows.length > 0) columnNames = Object.keys(rows[0])

        /**
         * The index column is not part of the columnNames or columnTypes array.
         * Those arrays are used with a linear index, so we need to adjust the index to get the correct type.
         * @param index the index of the column
         * @returns the index of the type in the columnTypes array
         */
        function getTypeIndexWithRespectToIndexColumn(index: number): number {
            const indexColumnIndex = columnNames?.indexOf(DataTable.indexColumnName_) ?? -1
            if (indexColumnIndex === -1) return index
            return index < indexColumnIndex ? index : index - 1
        }

        if (columnNames === undefined) columnNames = Object.keys(rows[0])
        if (columnTypes === "infer") columnTypes = Array.from({ length: columnNames.length }, () => "infer")
        const columns = columnNames.map((name, index) => {
            let type: ColumnType | null = null
            if (name === DataTable.indexColumnName_) {
                type = t.number
            } else {
                const columnTypeDefinition = columnTypes[getTypeIndexWithRespectToIndexColumn(index)]
                if (columnTypeDefinition === "infer") {
                    type = TypePredictor.predictType(rows.map(row => row[name]), name)
                } else {
                    type = columnTypeDefinition as ColumnType
                }
            }

            if (type === null) throw new Error(`Could not infer type for column ${name}`)

            if (t.utils.isEnum(type) && !t.registry.getEnum(type.enumName)) {
                t.registry.registerEnum(type.enumName, { columns: [name] })
            }

            const values = rows.map(row => TypeConverter.toType(row[name], type!));
            return new DataColumn(name, type, values);
        });

        return new DataTable(columns);
    }

    /**
     * Create a new completely empty DataTable
     * @returns A new DataTable without any rows or columns
     */
    static empty() {
        return new DataTable()
    }

    /**
     * Deserialize a DataTable from a JSON object.
     * @param table JSON object representing the DataTable
     * @returns A new DataTable with the data from the JSON object
     */
    static deserialize(table: SerializedTable): DataTable {
        const deserializedTable = DataTable.fromColumns(table.map(col => DataColumn.deserialize(col)))
        // we clean up all values that don't match the type
        deserializedTable.setColumnTypes(deserializedTable.getColumnTypes())
        return deserializedTable
    }

    static fromNormalizedTable(normalizedTable: NormalizedDataTable): DataTable {
        const columns = normalizedTable.columns.map(col => new DataColumn(col.name, col.type, normalizedTable.rows.map(row => row[col.name])))
        return new DataTable(columns)
    }

    /**
     * Create a DataTable from a CSV file.
     * 
     * The CSV file is parsed using the specified options.
     * The default options are:
     * - delimiter: ','
     * - newLine: '\r\n' if it is found, otherwise '\n'
     * - header: true
     * - columnTypes: "infer"
     * - columnNames: []
     * - encoding: 'utf-8'
     * 
     * @param file The CSV file to create the table from
     * @param options Options to use when parsing the CSV file
     * @returns A Promise that resolves to a new DataTable with the data from the CSV file
     */
    static async fromCSV(file: File, options: Partial<CsvOptions> = {}): Promise<DataTable> {
        const options_: CsvOptions = {
            delimiter: ',',
            newLine: '\n',
            header: true,
            columnTypes: "infer",
            columnNames: [],
            encoding: 'utf-8',
            ...options
        }

        const reader = new FileReader();
        reader.readAsText(file, options_.encoding);

        // TODO: Add error handling, check options, etc.
        return new Promise<DataTable>((resolve, reject) => {
            reader.onload = () => {
                const text = reader.result as string;
                if (!options.newLine && text.includes("\r\n")) {
                    options_.newLine = "\r\n";
                }

                // the regex finds all delimiters that are not surrounded by double quotes
                const rowSplitRegex = new RegExp(`${options_.delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`, "g")

                // split rows at newLine symbol and remove blank/empty lines
                const rows = text.split(options_.newLine).filter(row => row.trim() !== "").map(row => {
                    const values = row.split(rowSplitRegex).map(value => {
                        // if the value is surrounded by double quotes "unescape" all double quotes and newlines
                        if (value.match(/^".*"$/g)) {
                            value = value.replace(/^"|"$/g, "")
                                .replace("\"\"", "\"")
                                .replace(options_.newLine.replace("\\", "\\\\"), options_.newLine)
                        }
                        return value
                    })
                    return values
                });

                const header = options_.header ? rows.shift()! : options_.columnNames;
                // all values are strings but we let fromRows deal with that
                try {
                    const table = DataTable.fromRows(rows.map(row => header.reduce((acc, name, index) => {
                        acc[name] = row[index];
                        return acc;
                    }, {} as DataRow)), options_.columnTypes, header);
                    resolve(table);
                } catch (error) {
                    reject(error);
                }
            }
            reader.onerror = () => reject(reader.error);
        })
    }

    static fromJSON(json: TableSaveFile): DataTable {
        if (json.meta) {
            for (const [name, hierarchy] of Object.entries(json.meta.hierarchies ?? {})) {
                t.registry.registerHierarchy(name, hierarchy)
            }
            for (const [name, enumDef] of Object.entries(json.meta.enums ?? {})) {
                t.registry.registerEnum(name, enumDef)
            }
        }
        return DataTable.deserialize(json.table)
    }
}