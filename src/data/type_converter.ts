import { DateTime } from "luxon";
import { ColumnType } from "./table";
import { IType, ValueOf } from "./types";
import t, { IListType, IStructType, StructFields } from "@/data/types";
import { TypeChecker } from "./type_checker";

export class TypeConverter {
    static toType<T extends ColumnType>(value: unknown, type: T): ValueOf<T> {
        const nullable = t.utils.isNullable(type);

        if (t.utils.isBoolean(type)) return this.toBoolean(value, nullable) as ValueOf<T>;
        if (t.utils.isNumber(type)) return this.toNumber(value, nullable) as ValueOf<T>;
        if (t.utils.isString(type)) return this.toString(value, nullable) as ValueOf<T>;
        if (t.utils.isTimestamp(type)) return this.toTimestamp(value, nullable) as ValueOf<T>;
        if (t.utils.isList(type)) return this.toList(value, type, nullable) as ValueOf<T>;
        if (t.utils.isStruct(type)) return this.toStruct(value, type, nullable) as ValueOf<T>;
        if (t.utils.isEnum(type)) return this.toString(value, nullable) as ValueOf<T>;
        if (t.utils.isHierarchy(type)) return this.toString(value, nullable) as ValueOf<T>;
        if (t.utils.isNull(type)) return null as ValueOf<T>;
        if (t.utils.isUnion(type)) {
            // find the type that matches the best
            const matchingTypes = type.types.filter(t => TypeChecker.checkType(t, value));
            if (matchingTypes.length === 0) {
                throw new Error(`Could not find matching type for value: ${value}`);
            }

            if (matchingTypes.length > 1) {
                console.warn(`Ambiguous type: ${value}`);
            }

            return this.toType(value, matchingTypes[0]) as ValueOf<T>;
        }

        throw new Error(`Invalid type: ${type.name}`);
    }

    protected static toBoolean(value: unknown, nullable: boolean): boolean | null {
        if (this.isNull(value) || value === "") return nullable ? null : false;
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") {
            if (value === "true") return true;
            if (value === "false") return false;
            if (!isNaN(parseFloat(value))) {
                return parseFloat(value) !== 0;
            }
        }
        throw new Error(`Could not convert value to boolean: ${value}`);
    }

    protected static toNumber(value: unknown, nullable: boolean): number | null {
        if (this.isNull(value) || value === "") return nullable ? null : 0;
        if (typeof value === "number") return value;
        if (typeof value === "boolean") return value ? 1 : 0;
        if (typeof value === "string") {
            if (!isNaN(parseFloat(value))) return parseFloat(value);
        }
        throw new Error(`Could not convert value to number: ${value}`);
    }

    protected static toString(value: unknown, nullable: boolean): string | null {
        if (this.isNull(value)) return nullable ? null : "null";
        if (Array.isArray(value) || typeof value === "object") {
            value = JSON.stringify(value);
        }
        return String(value);
    }

    protected static toList(value: unknown, type: IListType<IType>, nullable: boolean): unknown[] | null {
        if (this.isNull(value) || value === "") return nullable ? null : [];
        if (typeof value === "string") {
            try {
                value = JSON.parse(value);
            } catch (e) {
                throw new Error(`Could not convert value to list: ${value}`);
            }
        }
        if (!Array.isArray(value)) {
            throw new Error(`Could not convert value to list: ${value}`);
        }
        return value.map(v => this.toType(v, type.elementType));
    }

    protected static toStruct(value: unknown, type: IStructType<StructFields>, nullable: boolean): Record<string, unknown> | null {
        if (this.isNull(value)) return nullable ? null : {};
        if (typeof value === "string") {
            try {
                value = JSON.parse(value);
            } catch (e) {
                throw new Error(`Could not convert value to struct: ${value}`);
            }
        }
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            throw new Error(`Could not convert value to struct: ${value}`);
        }
        const struct: Record<string, unknown> = {};
        for (const key of Object.keys(type.fields)) {
            struct[key] = this.toType(value[key as keyof typeof value], type.fields[key]);
        }
        return struct;
    }

    protected static isNull(value: unknown): boolean {
        return value === null || value === undefined || value === "undefined" || value === "null" || value === "NaN" || value === "";
    }

    protected static toTimestamp(value: unknown, nullable: boolean): string | null {
        if (this.isNull(value) || value === "") return nullable ? null : DateTime.fromMillis(0).toISO();
        if (typeof value === "number") return DateTime.fromMillis(value).toISO();
        if (typeof value === "string") {
            const date = DateTime.fromISO(value);
            if (date.isValid) return value;
            else if (!isNaN(parseFloat(value))) return DateTime.fromMillis(parseFloat(value)).toISO();
        }
        throw new Error(`Could not convert value to timestamp: ${value}`);
    }
}