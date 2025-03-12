import { store } from "@/store/store";
import { Hierarchy, IHierarchyDefinition } from "./hierarchy";
import { DataTable, SerializedTable } from "./table";
import types, { IType } from "./types";
import { TypeChecker } from "./type_checker";
import { debug } from "@/utils/logger";

export class TypeRegistry {
    private hierarchies: Map<string, Hierarchy> = new Map();
    private enums: Map<string, EnumDefinition> = new Map();

    public registerHierarchy(type: string, hierarchy: IHierarchyDefinition) {
        debug(`TypeRegistry.registerHierarchy: ${type}`).addVariable("Hierarchy", type).log();
        this.hierarchies.set(type, new Hierarchy(hierarchy, type));
    }

    public getHierarchy(type: string): Hierarchy | null {
        return this.hierarchies.get(type) || null;
    }

    public getHierarchyNames(): string[] {
        return Array.from(this.hierarchies.keys());
    }

    public registerEnum(type: string, definition: EnumDefinition) {
        debug(`TypeRegistry.registerEnum: ${type}`).addVariable("Enum", type).log();
        this.enums.set(type, definition);
    }

    public getEnum(type: string): EnumDefinition | null {
        return this.enums.get(type) || null;
    }

    public getEnumValues(type: string, table?: DataTable | SerializedTable): string[] {
        const definition = this.enums.get(type);
        if (definition === undefined) {
            return [];
        }

        if (Array.isArray(definition)) {
            return definition;
        }

        if (typeof definition === "function") {
            if (table !== undefined && !(table instanceof DataTable)) table = DataTable.deserialize(table);
            else if (table === undefined) table = DataTable.fromNormalizedTable(store.getState().sourceTable);
            return definition(table);
        } else {
            let values: string[] = [];

            definition.columns.forEach(columnName => {
                const originalColumnName = columnName;
                if (columnName.includes(".")) columnName = columnName.split(".")[0];
                let column: { type: IType, name: string, values: unknown[] } | undefined = undefined

                if (table !== undefined && !(table instanceof DataTable)) {
                    const serializedColumn = table.find(column => column.name === columnName);
                    if (serializedColumn) {
                        column = { type: types.utils.fromString(serializedColumn.type), name: serializedColumn.name, values: serializedColumn.values };
                    }
                } else if (table !== undefined && table instanceof DataTable) {
                    const dataColumn = table.getColumnByName(columnName);
                    if (dataColumn) {
                        column = { type: dataColumn.type, name: dataColumn.name, values: dataColumn.values };
                    }
                } else if (table === undefined) {
                    const serializedColumn = store.getState().sourceTable.columns.find(column => column.name === columnName);
                    if (serializedColumn) {
                        column = { type: serializedColumn.type, name: serializedColumn.name, values: store.getState().sourceTable.rows.map(row => row[columnName]) };
                    }
                }

                if (column) {
                    const instructions = originalColumnName.split(".").slice(1);
                    // instructions is an array of strings that represent the path to the value we want to extract
                    // it can be used to extract values from nested structs.
                    // there are some special instructions:
                    // - "$index" will extract all values from a list
                    // - "$events" will extract all events from a timeline
                    // - "$intervals" will extract all intervals from a timeline
                    // after the special instructions, we can use the names of the fields in the struct or other special instructions, no matter how deep they are nested

                    if (instructions.length === 0) {
                        // we do not have any instructions, so we just use the values of the column
                        values = values.concat(column.values.map(value => String(value)));
                    } else {
                        const extractedValues: unknown[] = [];
                        for (const value of column.values) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            let currentValues: any[] = [value];
                            for (const instruction of instructions) {
                                if (instruction.startsWith("$index[")) {
                                    const index = parseInt(instruction.slice(7, -1)); // we only keep the part between the brackets: $index[...]
                                    currentValues = currentValues.map(v => v[index]);
                                } else if (instruction === "$all") {
                                    // we extract all values from a list
                                    currentValues = currentValues.flat();
                                } else if (currentValues.some(v => Object.prototype.hasOwnProperty.call(v, instruction))) {
                                    // we extract a field from a struct
                                    currentValues = currentValues.filter(v => Object.prototype.hasOwnProperty.call(v, instruction)).map(v => v[instruction]);
                                } else if (instruction === "$events") {
                                    // we extract all events from a timeline
                                    currentValues = currentValues.flatMap(v => {
                                        return v.filter((entry: unknown) => TypeChecker.checkType(types.event(types.enum(types.wildcard)), entry));
                                    });
                                } else if (instruction === "$intervals") {
                                    // we extract all intervals from a timeline
                                    currentValues = currentValues.flatMap(v => {
                                        return v.filter((entry: unknown) => TypeChecker.checkType(types.interval(types.enum(types.wildcard)), entry));
                                    });
                                }
                            }
                            extractedValues.push(...currentValues); // TODO: this is not really clean but the entire extraction system is not very nice...
                        }

                        values = values.concat(extractedValues.filter(v => typeof v !== "object").map(value => String(value)));
                    }
                }
            });

            return Array.from(new Set(values));
        }
    }

    static init() {
        debug("TypeRegistry.init").log();
        const typeRegistry = new TypeRegistry();

        return typeRegistry;

    }
}

export type EnumDefinition = string[] | { columns: string[] } | ((table: DataTable) => string[])

export const typeRegistry = TypeRegistry.init();