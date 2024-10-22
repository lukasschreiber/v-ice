import { DateTime } from "luxon";
import { typeRegistry } from "./type_registry";
import { IEventType, IHierarchyType, IIntervalType, UnionType, ValueOf } from "./types";
import t, { IBooleanType, IEnumType, IListType, INumberType, IStringType, IStructType, IType, StructFields } from "./types";

export class TypeChecker {
    protected static checkTypeInternal<T extends IType>(type: T, value: unknown | undefined | null): value is ValueOf<T> {
        if(value === undefined || value === null) return type.nullable
        if(t.utils.isUnion(type)) {
            const matchesAtLeastOneUnionElement = type.types.some((t) => {
                try {
                    return this.checkTypeInternal(t, value)
                } catch (e) {
                    return false
                }
            })

            if (!matchesAtLeastOneUnionElement) throw new Error(`Value does not match any of the union types.`)
            return true
        }
        if(t.utils.isTimeline(type)) return this.isTimeline(type, value)
        if(t.utils.isEvent(type)) return this.isEvent(type, value)
        if(t.utils.isInterval(type)) return this.isInterval(type, value)
        if(t.utils.isBoolean(type)) return this.isBoolean(value)
        if(t.utils.isNumber(type)) return this.isNumber(value)
        if(t.utils.isString(type)) return this.isString(value)
        if(t.utils.isEnum(type)) return this.isEnum(type, value)
        if(t.utils.isHierarchy(type)) return this.isHierarchy(type, value)
        if(t.utils.isList(type)) return this.isList(type, value)
        if(t.utils.isStruct(type)) return this.isStruct(type, value)
        if(t.utils.isTimestamp(type)) return this.isISODate(value)
        if(t.utils.isWildcard(type)) return true
        return false
    }

    static checkType<T extends IType>(type: T, value: unknown | undefined | null): boolean {
        try {
            return this.checkTypeInternal(type, value)
        } catch (e) {
            return false
        }
    }

    static checkTypeWithReason<T extends IType>(type: T, value: unknown | undefined | null): { valid: boolean, reason?: string } {
        try {
            this.checkTypeInternal(type, value)
            return { valid: true }
        } catch (e) {
            if (e instanceof Error) {
                console.log(e.stack)
                return { valid: false, reason: e.message }
            }
            return { valid: false }
        }
    }

    static checkTypeCompatibility(leftType: IType, rightType: IType): boolean {
        if (this.isDeepEqual(leftType, rightType)) return true
        if (t.utils.isNullable(leftType) && t.utils.isNullable(rightType)) return this.checkTypeCompatibility(t.utils.removeNullable(leftType), t.utils.removeNullable(rightType))
        if (t.utils.isNullable(leftType)) return this.checkTypeCompatibility(t.utils.removeNullable(leftType), rightType)
        if (t.utils.isNullable(rightType)) return this.checkTypeCompatibility(leftType, t.utils.removeNullable(rightType)) && t.utils.isNullable(leftType)
        if (t.utils.isWildcard(leftType)) return true
        if (t.utils.isUnion(leftType) && t.utils.isUnion(rightType)) return leftType.types.every((type) => rightType.types.some((t) => this.checkTypeCompatibility(type, t))) // TODO: This is wrong, it should be right -> left, currently that fails for timeline matches blocks, I do not know why, so this is a temporary fix
        if (t.utils.isUnion(leftType)) return leftType.types.some((type) => this.checkTypeCompatibility(type, rightType))
        if (t.utils.isUnion(rightType)) return rightType.types.some((type) => this.checkTypeCompatibility(leftType, type))
        if (t.utils.isList(leftType) && t.utils.isList(rightType)) return this.checkTypeCompatibility(leftType.elementType, rightType.elementType)
        if (t.utils.isEnum(leftType) && t.utils.isEnum(rightType) && leftType.wildcard) return true
        if (t.utils.isHierarchy(leftType) && t.utils.isHierarchy(rightType) && leftType.wildcard) return true
        if (t.utils.isStruct(leftType) && t.utils.isStruct(rightType) && leftType.wildcard) return true
        if (t.utils.isStruct(leftType) && t.utils.isStruct(rightType)) {
            const leftFields = leftType.fields
            const rightFields = rightType.fields
            return Object.keys(leftFields).every((key) => {
                if (!rightFields[key]) return false
                return this.checkTypeCompatibility(leftFields[key], rightFields[key])
            })
        }

        // special cases for compatible primitive types
        if (t.utils.isString(leftType) && t.utils.isTimestamp(rightType)) return true
        if (t.utils.isString(leftType) && t.utils.isEnum(rightType)) return true
        if (t.utils.isString(leftType) && t.utils.isHierarchy(rightType)) return true

        return false
    }

    protected static isBoolean(value: unknown): value is ValueOf<IBooleanType> {
        if (typeof value !== "boolean") throw new Error(`Boolean must be a JS boolean. Got: ${typeof value} instead.`)
        return true
    }

    protected static isNumber(value: unknown): value is ValueOf<INumberType> {
        if (typeof value !== "number") throw new Error(`Number must be a JS number. Got: ${typeof value} instead.`)
        return true
    }

    protected static isString(value: unknown): value is ValueOf<IStringType> {
        if (typeof value !== "string") throw new Error(`String must be a JS string. Got: ${typeof value} instead.`)
        return true
    }

    protected static isEnum<T extends IEnumType>(type: T, value: unknown): value is ValueOf<T> {
        if (typeof value !== "string") throw new Error(`Enum must be a JS string. Got: ${typeof value} instead.`)
        if (typeRegistry.getEnum(type.enumName) === undefined) throw new Error(`Enum ${type.enumName} is not registered.`)
        return true
    }

    protected static isISODate(value: unknown): value is string {
        if (typeof value !== "string") throw new Error(`Timestamp must be a JS string. Got: ${typeof value} instead.`)
        if (value === "") throw new Error(`Timestamp must not be empty.`)
        if (!DateTime.fromISO(value).isValid) throw new Error(`Timestamp must be a valid ISO 8601 date. Got: ${value} instead.`)
        return true
    }

    protected static isList<T extends IType>(type: IType, value: unknown): value is ValueOf<IListType<T>> {
        if (!Array.isArray(value)) throw new Error(`List must be an JS array. Got: ${typeof value} instead.`)
        if (!value.every((v) => this.checkTypeInternal((type as IListType<T>).elementType, v))) throw new Error(`List elements do not match the expected type ${(type as IListType<T>).elementType.name}.`)
        return true
    }

    protected static isStruct<T extends StructFields>(type: IType, value: unknown): value is ValueOf<IStructType<T>> {
        if (value === null || typeof value !== "object") throw new Error(`Struct must be an JS object. Got: ${typeof value} instead.`)
        if (!Object.entries((type as IStructType<T>).fields).every(([key, fieldType]) => {
            const fieldValue = value[key as keyof typeof value]
            if (fieldValue === undefined && !fieldType.nullable) {
                throw new Error(`Field ${key} is missing in struct.`)
            }
            return this.checkTypeInternal(fieldType, fieldValue)
        })) throw new Error(`Struct fields do not match the expected types.`)

        return true
    }

    protected static isEvent<T extends StructFields>(type: IType, value: unknown): value is ValueOf<IEventType<T>> {
        return this.isStruct(type, value) && (value as Record<string, unknown>).timestamp !== undefined && (value as Record<string, unknown>).type !== undefined
    }

    protected static isInterval<T extends StructFields>(type: IType, value: unknown): value is ValueOf<IIntervalType<T>> {
        return this.isStruct(type, value) && (value as Record<string, unknown>).start !== undefined && (value as Record<string, unknown>).end !== undefined && (value as Record<string, unknown>).type !== undefined
    }

    protected static isTimeline(type: IType, value: unknown): value is ValueOf<IListType<UnionType<[IEventType<StructFields>, IEventType<StructFields>]>>> {
        if (!this.isList(type, value)) throw new Error("Timeline must be a list.")
        const elementType = (type as IListType<UnionType<[IEventType<StructFields>, IEventType<StructFields>]>>).elementType
        const validStructTypes = t.utils.isUnion(elementType) ? elementType.types : [elementType]
        return (value as unknown[]).every((v) => {
            return validStructTypes.some((structType) => {
                try {
                    return this.isEvent(structType, v) || this.isInterval(structType, v)
                } catch (e) {
                    return false
                }
            })
        })
    }

    protected static isHierarchy(type: IType, value: unknown): value is ValueOf<IHierarchyType> {
        const hierarchy = typeRegistry.getHierarchy((type as IHierarchyType).hierarchy)?.getHierarchy()
        if (!hierarchy) throw new Error(`Hierarchy ${type.name} is not registered.`)
        if (typeof value !== "string") throw new Error(`Hierarchy must be a JS string. Got: ${typeof value} instead.`)
        // we do not check if the value is a valid hierarchy entry
        return true
    }

    static isDeepEqual(a: unknown, b: unknown): boolean {
        if (a === b) return true
        if (typeof a !== typeof b) return false
        if (typeof a !== "object") return false
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false
            return a.every((v, i) => this.isDeepEqual(v, b[i]))
        }
        if (a === null || b === null) return false
        if (typeof b !== "object") return false
        if (Object.keys(a).length !== Object.keys(b).length) return false
        return Object.keys(a).every((key) => this.isDeepEqual(a[key as keyof typeof a], b[key as keyof typeof b]))
    }
}