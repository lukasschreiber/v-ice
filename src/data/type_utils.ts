import { IEnumType, IEventType, IHierarchyType, IIntervalType, IListType, INullType, INullableType, INumberType, IPrimitiveType, IStructType, IType, IUnionType, IWildcardType, StructFields, UnionType, ValueOf } from "./types";
import t from "./types";
import { TypeChecker } from "./type_checker";
import { typeRegistry } from "./type_registry";

export function toString(type: IType): string {
    return type.name;
}

export function isType(value: unknown): value is IType {
    return value !== undefined && value !== null && typeof value === "object" && "name" in value && "primitive" in value;
}

export function isPrimitive(type: IType): type is IPrimitiveType {
    return type.primitive;
}

export function isNullable<T extends IType>(type: IType): type is INullableType<T> {
    return type.nullable;
}

export function isList<T extends IType>(type: IType): type is IListType<T> {
    return !type.primitive && "elementType" in type;
}

export function isStruct(type: IType): type is IStructType<StructFields> {
    return !type.primitive && "fields" in type;
}

export function isEnum(type: IType): type is IEnumType {
    return !type.primitive && "enumName" in type;
}

export function isHierarchy(type: IType): type is IHierarchyType {
    return !type.primitive && "hierarchy" in type;
}

export function isNumber(type: IType): type is INumberType {
    return nameWithoutNullable(type) === "Number";
}

export function isNull(type: IType): type is INullType {
    return nameWithoutNullable(type) === "Null";
}

export function isWildcard(type: IType): type is IWildcardType {
    return nameWithoutNullable(type) === "*";
}

export function isString(type: IType): type is IPrimitiveType {
    return nameWithoutNullable(type) === "String";
}

export function isBoolean(type: IType): type is IPrimitiveType {
    return nameWithoutNullable(type) === "Boolean";
}

export function isTimestamp(type: IType): type is IPrimitiveType {
    return nameWithoutNullable(type) === "Timestamp";
}

export function isTimeline(type: IType): type is IListType<UnionType<[IEventType<StructFields>, IIntervalType<StructFields>]>> {
    return type.name.startsWith("Timeline<");
}

export function isEvent<T extends StructFields>(type: IType): type is IEventType<T> {
    return isStruct(type) && "timestamp" in type.fields && "type" in type.fields;
}

export function isInterval<T extends StructFields>(type: IType): type is IIntervalType<T> {
    return isStruct(type) && "start" in type.fields && "end" in type.fields && "type" in type.fields;
}

export function isUnion<T extends [IType, ...IType[]]>(type: IType): type is IUnionType<T> {
    return "types" in type;
}

export function removeNullable<T extends IType>(type: INullableType<T>): T {
    return { ...type, name: nameWithoutNullable(type), nullable: false } as T;
}

export function inferAbstractType(abstract: IType, concrete: IType): IType | null {
    if (!TypeChecker.checkTypeCompatibility(abstract, concrete)) throw new Error("The types are not compatible");

    // if both types are nullable we can remove the nullable
    if (isNullable(abstract) && isNullable(concrete)) return inferAbstractType(removeNullable(abstract), removeNullable(concrete));

    // if the abstract type is nullable we can remove the nullable since non nullable types are compatible with nullable types
    if (isNullable(abstract)) return inferAbstractType(removeNullable(abstract), concrete);

    if(isUnion(abstract)) {
        if(isUnion(concrete)) {
            // if both types are unions create a new union with all compatible and inferred types
            const abstractTypes = abstract.types.filter(t => concrete.types.some(c => TypeChecker.checkTypeCompatibility(t, c)))
            return t.union(...abstractTypes.map(t => inferAbstractType(t, abstract.types.find(t => TypeChecker.checkTypeCompatibility(t, concrete))!)) as [IType, IType, ...IType[]]);
        } else {
            // if the concrete type is not a union we want to find the compatible type in the union
            const abstractTypes = abstract.types.filter(t => TypeChecker.checkTypeCompatibility(t, concrete)) ?? [];
            if (abstractTypes.length === 1) {
                // we have one union type that is compatible with the concrete type
                const inferredType = inferAbstractType(abstractTypes[0], concrete);
                return replaceAbstractType(abstractTypes[0], inferredType!);
            } else if (abstractTypes.length > 1) {
                // we have more than one fitting types in the union, we want to select the most specific type
                // handcrafted priorities for now
                if (abstractTypes.some(t => isTimestamp(t))) {
                    return inferAbstractType(abstractTypes.find(t => isTimestamp(t))!, concrete);
                }

                return inferAbstractType(abstractTypes[0], concrete);
            }
            return null;
        }
    }

    // if the abstract type is a wildcard we can replace it with the concrete type
    if (isWildcard(abstract)) return concrete;
    // if both types are enums and the abstract enum is a wildcard enum we can replace it with the concrete enum
    if (isEnum(abstract) && isEnum(concrete) && abstract.wildcard) return concrete;
    // if both types are hierarchies and the abstract hierarchy is a wildcard hierarchy we can replace it with the concrete hierarchy
    if (isHierarchy(abstract) && isHierarchy(concrete) && abstract.wildcard) return concrete;
    // if both types are lists we can infer the element type
    if (isList(abstract) && isList(concrete)) return inferAbstractType(abstract.elementType, concrete.elementType);
    // if both types are structs we can infer the field types
    if (isStruct(abstract) && isStruct(concrete)) {
        if (abstract.wildcard) return concrete;
        const inferredFields: IType[] = []
        // to be compatible the concrete struct must have all fields of the abstract struct, the concrete struct can have more fields
        for (const [key, value] of Object.entries(abstract.fields)) {
            const inferred = inferAbstractType(value, concrete.fields[key]);
            if (inferred !== null) {
                inferredFields.push(inferred);
            }
        }
        if (inferredFields.some(i => inferredFields.find(j => i !== j && !TypeChecker.isDeepEqual(i, j)) !== undefined)) {
            throw new Error("The struct fields have conflicting types");
        }
        return inferredFields.length > 0 ? inferredFields[0] : null;
    }

    // if we could not infer the type we return the abstract type (due to recursion it might not be actually abstract anymore at this point)
    return abstract;
}

export function replaceAbstractType(type: IType, concrete: IType): IType {
    // all wildcards should be replaced with concrete type
    if (isNullable(type)) return t.nullable(replaceAbstractType(removeNullable(type), concrete));
    if (isWildcard(type) || isEnum(type) || isHierarchy(type)) return concrete;
    if (isUnion(type)) {
        const unionTypes = type.types.map(t => replaceAbstractType(t, concrete));
        // to get the best fitting type we pick the compatible type from the union
        return unionTypes.find(t => TypeChecker.checkTypeCompatibility(t, concrete)) ?? concrete;
    }
    if (isList(type)) return t.list(replaceAbstractType(type.elementType, concrete));
    if (isStruct(type)) {
        if (type.wildcard) return concrete;
        const fields: StructFields = {};
        for (const [key, value] of Object.entries(type.fields)) {
            fields[key] = replaceAbstractType(value, concrete);
        }
        return t.struct(fields);
    }
    return type;

}

export function customFields<T extends StructFields>(value: ValueOf<IEventType<T>> | ValueOf<IIntervalType<T>>): ValueOf<IStructType<T>> {
    const newValue: ValueOf<IStructType<T>> = { ...value };
    delete newValue.type;
    delete newValue.timestamp;
    delete newValue.start;
    delete newValue.end;
    return newValue;
}

export function fromString(type: string): IType {
    const listRegex = /^List<(.+)>$/;
    const structRegex = /^{(.+)}$/;
    const timelineRegex = /^Timeline<(.+)>$/;
    const enumRegex = /^Enum<(.*)>$/;
    const hierarchyRegex = /^Hierarchy<(.*)>$/;
    const nullableRegex = /(.+)\?$/;
    const unionRegex = /^Union<(.+) \| (.+)>$/;

    let parsedType: IType | null = null;

    if (nullableRegex.test(type)) {
        return t.nullable(fromString(nullableRegex.exec(type)![1]));
    }

    switch (type) {
        case "Number": return t.number;
        case "String": return t.string;
        case "Boolean": return t.boolean;
        case "Timestamp": return t.timestamp;
        case "Null": return t.null;
        case "*": return t.wildcard;
    }

    if (listRegex.test(type)) {
        const match = listRegex.exec(type);
        if (match) {
            const elementType = fromString(match[1]);
            parsedType = t.list(elementType);
        }
    } else if (timelineRegex.test(type)) {
        const match = timelineRegex.exec(type);
        if (match) {         
            parsedType = t.timeline(fromString(match[1]) as UnionType<[IEventType<StructFields>, IIntervalType<StructFields>]>);
        }
    } else if (unionRegex.test(type)) {
        parsedType = t.union(...type.replace(/^Union<|>$/g, "").split(" | ").map(fromString) as [IType, IType, ...IType[]]);
    } else if (structRegex.test(type)) {
        const match = structRegex.exec(type);
        if (match) {
            if (match[1] === "*") {
                parsedType = t.struct(t.wildcard);
            } else {
                const fields = match[1].split(", ").map(field => {
                    const [key, value] = field.split(": ");
                    return [key, fromString(value)];
                });
                parsedType = t.struct(Object.fromEntries(fields));
            }
        }
    } else if (enumRegex.test(type)) {
        const match = enumRegex.exec(type);
        if (match) {
            if (match[1] === "*") {
                parsedType = t.enum(t.wildcard);
            } else {
                const enumName = match[1];
                if (enumName !== "" && !typeRegistry.getEnum(enumName)) {
                    throw new Error(`Enum ${enumName} not found in type registry`);
                }
                parsedType = t.enum(match[1]);
            }
        }
    } else if (hierarchyRegex.test(type)) {
        const match = hierarchyRegex.exec(type);
        if (match) {
            const hierarchyName = match[1];
            if (hierarchyName !== "" && hierarchyName !== "*" && !typeRegistry.getHierarchy(hierarchyName)) {
                throw new Error(`Hierarchy ${hierarchyName} not found in type registry`);
            }
            parsedType = t.hierarchy(hierarchyName === "*" ? t.wildcard : hierarchyName);
        }
    }

    if (parsedType === null) {
        throw new Error(`The type could not be parsed. Tried to parse ${JSON.stringify(type)}`);
    }

    return parsedType;
}

function nameWithoutNullable(type: IType): string {
    return type.name.replace("?", "");
}