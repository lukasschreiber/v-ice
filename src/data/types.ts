import { typeRegistry } from "./type_registry";
import * as utils from './type_utils';

/**
 * The ValueOf type is a utility type that extracts the value type (a typescript primitive) of a type.
 * All types in the type system should have a corresponding value type.
 */
export type ValueOf<T extends IType> =
    T extends INullableType<infer U> ? ValueOf<U> | null :
    T extends INumberType ? number :
    T extends IBooleanType ? boolean :
    T extends ITimestampType ? string :
    T extends IStringType ? string :
    T extends IEnumType ? string :
    T extends IWildcardType ? any :
    T extends IHierarchyType ? string :
    T extends INullableType<infer U> ? ValueOf<U> | null :
    T extends IListType<infer U> ? ValueOf<U>[] :
    T extends IUnionType<infer U> ? ValueOf<U[number]> :
    T extends IStructType<infer U> ? {
        [K in keyof U]: ValueOf<U[K]> extends never ? any : ValueOf<U[K]>;
    } : never;

/**
 * The IType interface is the base interface for all types in the type system.
 * It contains the following properties:
 * - name: a string that represents the entire type, this is used for serialization and deserialization
 * - nullable: a boolean that indicates whether the type is nullable
 * - primitive: a boolean that indicates whether the type is a primitive type, this is not currently used
 */
export interface IType {
    name: string;
    nullable: boolean;
    primitive: boolean;
}

/**
 * The IListType interface represents a list type in the type system.
 * It contains only values of the same type defined by the elementType property.
 */
export interface IListType<T extends IType> extends IType {
    elementType: T;
    primitive: false;
}

/**
 * The IPrimitiveType interface represents a primitive type in the type system.
 */
export interface IPrimitiveType extends IType {
    primitive: true;
}

/**
 * The IAbstractType interface represents an abstract type in the type system.
 * It is a type that can only be used during type checking.
 * Actually it is needed to make the UML diagram less wide :D
 */
export interface IAbstractType extends IType {
}

/**
 * The IEnumType interface represents an enum type in the type system.
 * It contains a list of value sources from which values can be drawn.
 * 
 * Value sources are currently column names of the source table.
 */
export interface IEnumType extends IType {
    primitive: false;
    enumName: string;
    wildcard: boolean;
}

/**
 * The StructFields type is a utility type that represents the fields of a struct type.
 * It is a mapping from field names to types.
 * 
 * A struct may not contain timeline entries, but it may contain other structs. - this probably has a reason, but I don't know what it is. ~ Lukas
 */
export type StructFields = { [key: string]: Exclude<IType, ITimelineEntryType<StructFields>> };

/**
 * The IStructType interface represents a struct type in the type system.
 * It contains a number of allowed properties defined by the fields property.
 * 
 * There are no optional properties, optionallity can be achieved by using the nullable type.
 */
export interface IStructType<T extends StructFields> extends IType {
    fields: T;
    wildcard: boolean;
    primitive: false;
}

/**
 * The ITimelineEntryType interface represents a timeline entry type in the type system.
 * This is a composite type that is a struct with a type property that is an enum type and is used to group timeline entries.
 */
export interface ITimelineEntryType<T extends StructFields> extends IStructType<{ type: IEnumType } & T> { }

/**
 * The IEventType interface represents an event type in the type system.
 * It is a timeline entry type with a timestamp property.
 * Due to the nature of struct types it can contain additional properties.
 */
export interface IEventType<T extends StructFields> extends ITimelineEntryType<{ timestamp: ITimestampType } & T> { }

/**
 * The IIntervalType interface represents an interval type in the type system.
 * It is a timeline entry type with start and end properties.
 * Due to the nature of struct types it can contain additional properties.
 */
export interface IIntervalType<T extends StructFields> extends ITimelineEntryType<{ start: ITimestampType, end: ITimestampType } & T> { }

/**
 * The INumberType interface represents a number type in the type system.
 */
export interface INumberType extends IPrimitiveType {
    name: "Number";
}

/**
 * The IStringType interface represents a string type in the type system.
 */
export interface IStringType extends IPrimitiveType {
    name: "String";
}

/**
 * The IBooleanType interface represents a boolean type in the type system.
 */
export interface IBooleanType extends IPrimitiveType {
    name: "Boolean";
}

/**
 * The ITimestampType interface represents a timestamp type in the type system.
 */
export interface ITimestampType extends IPrimitiveType {
    name: 'Timestamp';
}

/**
 * The INullType interface represents a null type in the type system.
 * This type is always nullable because the only value it can have is null.
 */
export interface INullType extends IPrimitiveType {
    name: 'Null';
    nullable: true;
}

/**
 * The INullableType interface represents a nullable type in the type system.
 * It is a wrapper around another type that makes it nullable.
 */
export interface INullableType<T extends IType> extends IType {
    name: `${T['name']}?`;
    nullable: true;
}

/**
 * The IWildcardType interface represents a wildcard type in the type system.
 * This type is used to represent any type.
 * Note that this type is not per se nullable, but it can be wrapped in a nullable type.
 */
export interface IWildcardType extends IAbstractType {
    name: '*';
}

/**
 * The IUnionType interface represents a union type in the type system.
 * It is a wrapper around a list of types that can be used in a union.
 * 
 * To keep the typescript type system happy, the types property is a tuple of types.
 */
export interface IUnionType<T extends [IType, ...IType[]]> extends IAbstractType {
    types: T;
}

/**
 * The UnionType type is a utility type that represents a union type in the type system.
 * It is a union of the IUnionType interface and the types in the union, this is used to make the typescript type system happy.
 */
export type UnionType<T extends [IType, ...IType[]]> = IUnionType<T> | T[number];

/**
 * The IHierarchyType interface represents a hierarchy type in the type system.
 * A hierarchy is represented by a hierarchy key that can be used to look up the hierarchy in the type registry.
 */
export interface IHierarchyType extends IType {
    primitive: false;
    hierarchy: string;
    wildcard: boolean;
}

/**
 * This creates a number type.
 */
const number: INumberType = { name: 'Number', nullable: false, primitive: true };

/**
 * This creates a string type.
 */
const string: IStringType = { name: 'String', nullable: false, primitive: true };

/**
 * This creates a boolean type.
 */
const boolean: IBooleanType = { name: 'Boolean', nullable: false, primitive: true };

/**
 * This creates a timestamp type.
 * The timestamp type is a number type that represents a timestamp in milliseconds.
 */
const timestamp: ITimestampType = { name: 'Timestamp', nullable: false, primitive: true };

/**
 * This creates a wildcard type.
 * 
 * The wildcard type is used to represent any type.
 * Note that this type is not per se nullable, but it can be wrapped in a nullable type.
 */
const wildcard: IWildcardType = { name: '*', nullable: false, primitive: true };

/**
 * This creates a null type.
 * 
 * The null type is always nullable because the only value it can have is null.
 */
const nullType: INullType = { name: "Null", nullable: true, primitive: true };

/**
 * This creates a union type.
 * 
 * A union type is a type that can be one of the types in the union.
 * 
 * @param types The types in the union.
 */
function union<T extends [IType, IType, ...IType[]]>(...types: T): UnionType<T> {
    return { name: `Union<${types.map(type => type.name).join(" | ")}>`, types: types, nullable: types.some(type => type.nullable), primitive: types.every(type => type.primitive) };
}

/**
 * This creates a list type.
 * 
 * A list type is a type that contains a list of elements of the same type.
 * 
 * @param type The type of the elements in the list.
 */
function list<T extends IType>(type: T): IListType<T> {
    return { name: `List<${type.name}>`, nullable: false, primitive: false, elementType: type };
}

/**
 * This creates a struct type.
 * 
 * A struct type is a type that contains a number of fields.
 * The fields are defined by a mapping from field names to types.
 * If the fields contain a wildcard type, the struct type is a wildcard struct type.
 * 
 * @param fields The fields of the struct type.
 */
function struct<T extends StructFields>(fields: T | IWildcardType): IStructType<T> {
    if (utils.isType(fields) && utils.isWildcard(fields)) return { name: "{*}", nullable: false, primitive: false, fields: {} as T, wildcard: true };
    return { name: `{${Object.entries(fields).map(([key, value]) => `${key}: ${value.name}`).join(", ")}}`, nullable: false, primitive: false, fields, wildcard: false };
}

/**
 * This creates an event type.
 * 
 * An event type is a timeline entry type with a timestamp property as well as custom properties defined by fields.
 * 
 * @param fields The custom properties of the event type.
 */
function event<T extends StructFields>(typeEnum: IEnumType, fields?: T): IEventType<T> {
    if (fields === undefined) fields = {} as T;
    return struct({ timestamp, type: typeEnum, ...fields });
}

/**
 * This creates an interval type.
 * 
 * An interval type is a timeline entry type with start and end properties as well as custom properties defined by fields.
 * 
 * @param fields The custom properties of the interval type.
 */
function interval<T extends StructFields>(typeEnum: IEnumType, fields?: T): IIntervalType<T> {
    if (fields === undefined) fields = {} as T;
    return struct({ start: timestamp, end: timestamp, type: typeEnum, ...fields });
}

/**
 * This creates a timeline type.
 * 
 * A timeline type is a list type that contains a list of timeline entries. It can contain both event and interval types, all valid children must be enumerated in a union type.
 * 
 * @param elementTypes The timeline entry types in the timeline.
 */
function timeline<T extends UnionType<[ITimelineEntryType<StructFields>, ...ITimelineEntryType<StructFields>[]]> | IWildcardType>(elementTypes: T): IListType<T> {
    return { name: `Timeline<${elementTypes.name}>`, nullable: false, primitive: false, elementType: elementTypes };
}

/**
 * This creates an enum type.
 * 
 * An enum type is a type that can have one of the values defined by the value sources.
 * 
 * @param enumName The enum definition key of the enum type.
 */
function enumType(enumName: string | IWildcardType): IEnumType {
    if (utils.isType(enumName) && utils.isWildcard(enumName)) return { name: "Enum<*>", nullable: false, primitive: false, enumName: "", wildcard: true };
    return { name: `Enum<${enumName}>`, nullable: false, primitive: false, enumName, wildcard: false };
}

/**
 * This creates a hierarchy type.
 * 
 * A hierarchy type is a type that represents a hierarchy in the type registry.
 * 
 * @param hierarchy The hierarchy key of the hierarchy type.
 */
function hierarchy(hierarchy: string | IWildcardType = ""): IHierarchyType {
    if (utils.isType(hierarchy) && utils.isWildcard(hierarchy)) return { name: "Hierarchy<*>", nullable: false, primitive: false, hierarchy: "", wildcard: true };
    if (hierarchy !== "" && !typeRegistry.getHierarchy(hierarchy)) {
        throw new Error(`Hierarchy ${hierarchy} not found in type registry`);
    }
    return { name: `Hierarchy<${hierarchy}>`, nullable: false, primitive: false, hierarchy, wildcard: false };
}

/**
 * This creates a nullable type.
 * 
 * A nullable type is a wrapper around another type that makes it nullable.
 * 
 * @param type The type to make nullable.
 */
function nullable<T extends IType>(type: T): INullableType<T> {
    return { ...type, name: `${type.name}?`, nullable: true };
}

/**
 * To have a single point of truth for all types, we export all types in a single object.
 * This object is used to access all types in the type system.
 * 
 * Utility functions are also exported here as utils and the type registry is exported as registry.
 */
const types = {
    number,
    string,
    boolean,
    timestamp,
    list,
    enum: enumType,
    null: nullType,
    wildcard,
    nullable,
    struct,
    hierarchy,
    timeline,
    union,
    event,
    interval,
    utils,
    registry: typeRegistry
};

export default types;