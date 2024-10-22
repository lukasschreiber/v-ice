import { DateTime } from "luxon";
import { ColumnType } from "./table";
import t, { IEventType, IIntervalType, IListType, IStructType, IType, IUnionType, StructFields, UnionType } from "./types";

export class TypePredictor {

    /**
     * Predicts the type of a column based on its values.
     * The name parameter is optional and is used to name the enum type. The name does not affect the prediction.
     * 
     * The prediction is based on the following rules:
     * - If all values can be converted to a boolean, the type is boolean. That includes strings that are "true" or "false" and numbers that are 0 or 1.
     * - If all values can be converted to a number, the type is number. That includes strings that are numbers. Scientific notation is supported, for example "1e3". The decimal separator is ".".
     * - If all values can be converted to a date, the type is date. The date format is flexible and can be in any format that can be parsed by the Date constructor. Dates that are numbers for example 20230101 are valid dates but recognized as numbers.
     * - If all values are timeline, the type is a timeline. The timeline field types are predicted recursively. The timeline fields can be strings that are JSON arrays of objects. The objects must have a "timestamp" field.
     * - If all values are lists, the type is a list. The list element type is predicted recursively. The list elements can be strings that are JSON arrays.
     * - If all values are structs, the type is a struct. The struct field types are predicted recursively. The struct fields can be strings that are JSON objects.
     * - If none of the above apply, the type is an enum and named after the name parameter.
     * 
     * The prediction is nullable if any of the values are null, undefined, or an empty string in a non-string type.
     * 
     * @param values a list of values with mixed types
     * @param name the name of the enum type
     * @returns the predicted type
     */
    static predictType(values: unknown[], name?: string): ColumnType | null {
        if (values.length === 0) return null;

        let predictedType: IType = t.string;

        const valuesWithoutNulls = values.filter(value => value !== null && value !== undefined && value !== "");

        // Timestamps are not supported yet because they could be mistaken for numbers. 
        // One approach could be to check if the values are integers and then check if they are in a valid timestamp range. For example current date +- 15 years.
        if (this.testNull(valuesWithoutNulls)) predictedType = t.null;
        else if (this.testBoolean(valuesWithoutNulls)) predictedType = t.boolean;
        else if (this.testNumber(valuesWithoutNulls)) predictedType = t.number;
        else if (this.testDate(valuesWithoutNulls)) predictedType = t.timestamp;
        else if (this.testTimeline(valuesWithoutNulls)) predictedType = this.predictTimelineType(values);
        else if (this.testList(valuesWithoutNulls)) predictedType = this.predictListType(values);
        else if (this.testStruct(valuesWithoutNulls)) predictedType = this.predictStructType(values);
        else predictedType = t.enum(name ?? "");

        if (this.predictNullable(values, predictedType) && !t.utils.isNull(predictedType)) return t.nullable(predictedType);
        return predictedType;
    }

    protected static predictNullable(values: unknown[], predictedType: IType): boolean {
        if (values.some(value => value === null)) {
            return true;
        }

        if (values.some(value => value === undefined)) {
            return true;
        }

        if (!t.utils.isString(predictedType) && !t.utils.isEnum(predictedType) && values.some(value => value === "" || value === "undefined" || value === "null" || value === "NaN")) {
            return true;
        }

        if (t.utils.isNumber(predictedType) && values.some(value => isNaN(value as number))) {
            return true;
        }

        return false;
    }

    protected static predictListType(values: unknown[]): IListType<IType> {
        values = this.parseElementJson(values)

        const uniqueValues = Array.from(new Set(values.flat()));
        const elementType = this.predictType(uniqueValues);
        if (elementType === null) throw new Error("Could not predict list element type");
        return t.list(elementType);
    }

    protected static predictStructType(values: unknown[]): IStructType<StructFields> | IUnionType<[IStructType<StructFields>, IStructType<StructFields>, ...IStructType<StructFields>[]]> {
        values = this.parseElementJson(values)

        const fieldOptions: StructFields[] = [];

        const uniqueValues = Array.from(new Set(values.flat())) as Record<string, unknown>[];
        for (const value of uniqueValues) {
            if (typeof value === "object" && value !== null) {
                const fieldOption = fieldOptions.find(option => Object.keys(option).length === Object.keys(value).length && Object.keys(option).every(key => key in value));
                if (!fieldOption) {
                    const fields: StructFields = {};
                    for (const key of Object.keys(value)) {
                        if (!fields[key]) {
                            const type = this.predictType(uniqueValues.map(v => v[key]), key);
                            if (type === null) throw new Error("Could not predict struct field type");
                            fields[key] = type;
                        }
                    }
                    fieldOptions.push(fields);
                }

            }
        }

        if (fieldOptions.length === 1) return t.struct(fieldOptions[0]);
        return t.union(...fieldOptions.map(fields => t.struct(fields)) as [IStructType<StructFields>, IStructType<StructFields>, ...IStructType<StructFields>[]]);
    }

    protected static predictTimelineType(values: unknown[]): IListType<UnionType<[IEventType<StructFields>, IIntervalType<StructFields>]>> {
        const structType = this.predictStructType(values);
        const elementTypes: (IEventType<StructFields> | IIntervalType<StructFields>)[] = []
        if (t.utils.isUnion(structType)) {
            for (const type of structType.types) {
                if(type.fields.timestamp && type.fields.type) {
                    type.fields.timestamp = t.timestamp;
                    type.fields.type = t.enum("event");
                    elementTypes.push(t.struct(type.fields) as IEventType<StructFields>);
                }
                if(type.fields.start && type.fields.end && type.fields.type) {
                    type.fields.start = t.timestamp;
                    type.fields.end = t.timestamp;
                    type.fields.type = t.enum("interval");
                    elementTypes.push(t.struct(type.fields)  as IIntervalType<StructFields>);
                }
            }

            if (elementTypes.length === 1) {
                return t.timeline(elementTypes[0]);
            }
            return t.timeline(t.union(...elementTypes as [IEventType<StructFields>, IIntervalType<StructFields>]));
        } else {
            if(structType.fields.timestamp && structType.fields.type) {
                structType.fields.timestamp = t.timestamp;
                structType.fields.type = t.enum("event");
                return t.timeline(t.struct(structType.fields) as IEventType<StructFields>);
            }
            if(structType.fields.start && structType.fields.end && structType.fields.type) {
                structType.fields.start = t.timestamp;
                structType.fields.end = t.timestamp;
                structType.fields.type = t.enum("interval");
                return t.timeline(t.struct(structType.fields) as IIntervalType<StructFields>);
            }
        }

        throw new Error("Invalid timeline");
    }

    protected static parseElementJson(values: unknown[]): unknown[] {
        return values.map(value => {
            if (typeof value === "string") {
                return JSON.parse(value);
            }
            return value;
        }).filter(value => value !== null && value !== undefined);
    }

    protected static testNumber(values: unknown[]): boolean {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return values.every(value => (typeof value === "number" || !isNaN(value as any)));
    }

    protected static testBoolean(values: unknown[]): boolean {
        return values.every(value => typeof value === "boolean" ||
            (typeof value === "string" && ["true", "false"].includes(value.toLowerCase())) ||
            (typeof value === "string" && !isNaN(parseFloat(value)) && [0, 1].includes(parseFloat(value))) ||
            (typeof value === "number" && [0, 1].includes(value)))
    }

    protected static testDate(values: unknown[]): boolean {
        return values.every(value => typeof value === "string" && DateTime.fromISO(value).isValid);
    }

    protected static testList(values: unknown[]): boolean {
        return values.every(value => Array.isArray(value) || (typeof value === "string" && value.startsWith("[") && value.endsWith("]") && Array.isArray(JSON.parse(value))));
    }

    protected static testStruct(values: unknown[]): boolean {
        return values.every(value => typeof value === "object" && !Array.isArray(value) && value !== null || (typeof value === "string" && value.startsWith("{") && value.endsWith("}") && typeof JSON.parse(value) === "object"));
    }

    protected static testTimeline(values: unknown[]): boolean {
        if (!this.testList(values)) return false
        return values.every(value => Array.isArray(value) && this.testStruct(value) && value.every(v => "timestamp" in v || ("start" in v && "end" in v)))
    }

    protected static testNull(values: unknown[]): boolean {
        return values.every(value => value === null || value === undefined || value === "" || (typeof value === "string" && ["undefined", "null", "NaN"].includes(value)) || (typeof value === "number" && isNaN(value)))
    }
}