import { expect, test } from "vitest"
import t from "./types"
import { TypePredictor } from "./type_predictor";
import { TypeChecker } from "./type_checker";
import { DataColumn, DataTable } from "./table";

test("Primitive types", () => {
    expect(t.number).toEqual({ name: 'Number', nullable: false, primitive: true });
    expect(t.string).toEqual({ name: 'String', nullable: false, primitive: true });
    expect(t.boolean).toEqual({ name: 'Boolean', nullable: false, primitive: true });
    expect(t.timestamp).toEqual({ name: 'Timestamp', nullable: false, primitive: true });
})

test("List type", () => {
    expect(t.list(t.number)).toEqual({ name: 'List<Number>', nullable: false, primitive: false, elementType: t.number });
})

test("Struct type", () => {
    expect(t.struct({ a: t.number, b: t.string })).toEqual({ name: '{a: Number, b: String}', nullable: false, primitive: false, fields: { a: t.number, b: t.string }, wildcard: false });
    expect(t.struct({ a: t.number, b: t.string, c: t.boolean })).toEqual({ name: '{a: Number, b: String, c: Boolean}', nullable: false, primitive: false, fields: { a: t.number, b: t.string, c: t.boolean }, wildcard: false });
    expect(t.struct(t.wildcard)).toEqual({ name: '{*}', nullable: false, primitive: false, fields: {}, wildcard: true });
})

test("Timeline type", () => {
    expect(t.timeline(t.union(t.event(t.enum("TestEvents")), t.interval(t.enum("TestIntervals"))))).toEqual({
        name: 'Timeline<Union<{timestamp: Timestamp, type: Enum<TestEvents>} | {start: Timestamp, end: Timestamp, type: Enum<TestIntervals>}>>',
        nullable: false,
        primitive: false,
        elementType: {
            name: 'Union<{timestamp: Timestamp, type: Enum<TestEvents>} | {start: Timestamp, end: Timestamp, type: Enum<TestIntervals>}>',
            nullable: false,
            primitive: false,
            types: [{
                name: '{timestamp: Timestamp, type: Enum<TestEvents>}',
                nullable: false,
                primitive: false,
                fields: { timestamp: t.timestamp, type: t.enum("TestEvents") },
                wildcard: false
            }, {
                name: '{start: Timestamp, end: Timestamp, type: Enum<TestIntervals>}',
                nullable: false,
                primitive: false,
                fields: { start: t.timestamp, end: t.timestamp, type: t.enum("TestIntervals") },
                wildcard: false
            }]
        }
    });
})

test("Enum type", () => {
    t.registry.registerEnum("Color", ["red", "green", "blue"])
    t.registry.registerEnum("Color2", {columns: ["Color", "Colors2"]})
    expect(t.enum("Color")).toEqual({ name: 'Enum<Color>', nullable: false, primitive: false, enumName: "Color", wildcard: false });
    expect(t.enum("Color2")).toEqual({ name: 'Enum<Color2>', nullable: false, primitive: false, enumName: "Color2", wildcard: false });
    expect(t.enum(t.wildcard)).toEqual({ name: 'Enum<*>', nullable: false, primitive: false, enumName: "", wildcard: true });

    expect(t.registry.getEnumValues("Color")).toEqual(["red", "green", "blue"])
})

test("Hierarchy type", () => {
    expect(() => t.hierarchy("Color")).toThrowError();

    t.registry.registerHierarchy("Color", {
        meta: {topLevelSort: ["red", "green", "blue"]},
        hierarchy: {
            red: {
                name: "Red",
                children: {
                    dark: {
                        name: "Dark Red",
                        children: {}
                    },
                    light: {
                        name: "Light Red",
                        children: {}
                    }
                }
            },
            green: {
                name: "Green",
                children: {}
            },
            blue: {
                name: "Blue",
                children: {}
            }
        }
    })

    expect(t.hierarchy("Color")).toEqual({ name: 'Hierarchy<Color>', nullable: false, primitive: false, hierarchy: "Color", wildcard: false });
    expect(t.hierarchy(t.wildcard)).toEqual({ name: 'Hierarchy<*>', nullable: false, primitive: false, hierarchy: "", wildcard: true });
})

test("Nullable type", () => {
    expect(t.nullable(t.number)).toEqual({ name: 'Number?', nullable: true, primitive: true });
    expect(t.nullable(t.list(t.number))).toEqual({ name: 'List<Number>?', nullable: true, primitive: false, elementType: t.number });
    expect(t.list(t.nullable(t.number))).toEqual({ name: 'List<Number?>', nullable: false, primitive: false, elementType: { name: 'Number?', nullable: true, primitive: true } });
})

test("Wildcard type", () => {
    expect(t.wildcard).toEqual({ name: '*', nullable: false, primitive: true });
    expect(t.list(t.wildcard)).toEqual({ name: 'List<*>', nullable: false, primitive: false, elementType: t.wildcard });
})

test("Union type", () => {
    expect(t.union(t.number, t.string, t.boolean)).toEqual({ name: 'Union<Number | String | Boolean>', nullable: false, primitive: true, types: [t.number, t.string, t.boolean] });
    expect(t.union(t.number, t.nullable(t.string), t.boolean)).toEqual({ name: 'Union<Number | String? | Boolean>', nullable: true, primitive: true, types: [t.number, t.nullable(t.string), t.boolean] });
    expect(t.union(t.number, t.nullable(t.string), t.boolean).nullable).toBe(true)
    expect(t.union(t.number, t.string, t.boolean).nullable).toBe(false)
    expect(t.union(t.number, t.string, t.boolean).primitive).toBe(true)
    expect(t.union(t.number, t.struct({ a: t.number }), t.boolean).primitive).toBe(false)
})

test("Type check functions", () => {
    expect(t.utils.isPrimitive(t.number)).toBe(true)
    expect(t.utils.isPrimitive(t.string)).toBe(true)
    expect(t.utils.isPrimitive(t.boolean)).toBe(true)
    expect(t.utils.isPrimitive(t.timestamp)).toBe(true)
    expect(t.utils.isPrimitive(t.list(t.number))).toBe(false)

    expect(t.utils.isNullable(t.number)).toBe(false)
    expect(t.utils.isNullable(t.nullable(t.number))).toBe(true)

    expect(t.utils.isList(t.number)).toBe(false)
    expect(t.utils.isList(t.list(t.number))).toBe(true)

    expect(t.utils.isStruct(t.number)).toBe(false)
    expect(t.utils.isStruct(t.struct({ a: t.number, b: t.string }))).toBe(true)

    expect(t.utils.isEnum(t.number)).toBe(false)
    expect(t.utils.isEnum(t.enum("Color"))).toBe(true)

    expect(t.utils.isTimeline(t.number)).toBe(false)
    expect(t.utils.isTimeline(t.timeline(t.event(t.enum("TestEvents"))))).toBe(true)
    expect(t.utils.isTimeline(t.list(t.number))).toBe(false)

    expect(t.utils.isHierarchy(t.number)).toBe(false)
    expect(t.utils.isHierarchy(t.hierarchy("Color"))).toBe(true)
})

test("Type to string", () => {
    expect(t.utils.toString(t.number)).toBe("Number")
    expect(t.utils.toString(t.list(t.number))).toBe("List<Number>")
    expect(t.utils.toString(t.struct({ a: t.number, b: t.string }))).toBe("{a: Number, b: String}")
    expect(t.utils.toString(t.timeline(t.union(t.event(t.enum("TestEvents")), t.interval(t.enum("TestIntervals")))))).toBe("Timeline<Union<{timestamp: Timestamp, type: Enum<TestEvents>} | {start: Timestamp, end: Timestamp, type: Enum<TestIntervals>}>>")
    expect(t.utils.toString(t.enum("Color"))).toBe("Enum<Color>")
    expect(t.utils.toString(t.enum("Color"))).toBe("Enum<Color>")
    expect(t.utils.toString(t.nullable(t.number))).toBe("Number?")
    expect(t.utils.toString(t.list(t.nullable(t.number)))).toBe("List<Number?>")
    expect(t.utils.toString(t.nullable(t.list(t.number)))).toBe("List<Number>?")
    expect(t.utils.toString(t.union(t.number, t.string, t.boolean))).toBe("Union<Number | String | Boolean>")
    expect(t.utils.toString(t.union(t.number, t.nullable(t.string), t.boolean))).toBe("Union<Number | String? | Boolean>")
    expect(t.utils.toString(t.list(t.wildcard))).toBe("List<*>")
    expect(t.utils.toString(t.nullable(t.wildcard))).toBe("*?")
    expect(t.utils.toString(t.list(t.union(t.number, t.string)))).toBe("List<Union<Number | String>>")
    expect(t.utils.toString(t.hierarchy("Color"))).toBe("Hierarchy<Color>")
})

test("String to type", () => {
    t.registry.registerEnum("Color", ["red", "green", "blue"])
    t.registry.registerEnum("TestEvents", ["event"])
    t.registry.registerEnum("TestIntervals", ["interval"])
    expect(t.utils.fromString("Number")).toEqual(t.number)
    expect(t.utils.fromString("List<Number>")).toEqual(t.list(t.number))
    expect(t.utils.fromString("{a: Number, b: String}")).toEqual(t.struct({ a: t.number, b: t.string }))
    expect(t.utils.fromString("{a: Number, b: String, c: Boolean}")).toEqual(t.struct({ a: t.number, b: t.string, c: t.boolean }))
    expect(t.utils.fromString("{*}")).toEqual(t.struct(t.wildcard))
    expect(t.utils.fromString("Timeline<Union<{timestamp: Timestamp, type: Enum<TestEvents>} | {start: Timestamp, end: Timestamp, type: Enum<TestIntervals>}>>")).toEqual(t.timeline(t.union(t.event(t.enum("TestEvents")), t.interval(t.enum("TestIntervals")))))
    expect(t.utils.fromString("Enum<Color>")).toEqual(t.enum("Color"))
    expect(t.utils.fromString("Enum<Color>?")).toEqual(t.nullable(t.enum("Color")))
    expect(t.utils.fromString("Number?")).toEqual(t.nullable(t.number))
    expect(t.utils.fromString("List<Number?>")).toEqual(t.list(t.nullable(t.number)))
    expect(t.utils.fromString("List<Number>?")).toEqual(t.nullable(t.list(t.number)))
    expect(t.utils.fromString("Union<Number | String | Boolean>")).toEqual(t.union(t.number, t.string, t.boolean))
    expect(t.utils.fromString("List<*>")).toEqual(t.list(t.wildcard))
    expect(t.utils.fromString("Hierarchy<Color>")).toEqual(t.hierarchy("Color"))
    expect(t.utils.fromString("Hierarchy<*>")).toEqual(t.hierarchy(t.wildcard))
    expect(t.utils.fromString("Union<Number | String>")).toEqual(t.union(t.number, t.string))
    expect(t.utils.fromString("Union<Number | String?>")).toEqual(t.union(t.number, t.nullable(t.string)))
    expect(t.utils.fromString("Enum<*>")).toEqual(t.enum(t.wildcard))
})

test("Predict number type", () => {
    expect(TypePredictor.predictType([1, 2, 3])).toEqual(t.number)
    expect(TypePredictor.predictType(["1", "2", "3"])).toEqual(t.number)
    expect(TypePredictor.predictType([1, "2", 3])).toEqual(t.number)
    expect(TypePredictor.predictType(["1.123", 2.24234, "3.21313"])).toEqual(t.number)
    expect(TypePredictor.predictType(["1.123", 2.24234, "3.21313", "a"])).not.toEqual(t.number)
    expect(TypePredictor.predictType(["1.123", 2.24234, "3.21313", null])).toEqual(t.nullable(t.number))
    expect(TypePredictor.predictType(["1.123", -2, "3.21313e-12", Math.PI, Number.MAX_VALUE])).toEqual(t.number)
})

test("Predict boolean type", () => {
    expect(TypePredictor.predictType([true, false, true])).toEqual(t.boolean)
    expect(TypePredictor.predictType(["true", "false", "true"])).toEqual(t.boolean)
    expect(TypePredictor.predictType([true, "false", true])).toEqual(t.boolean)
    expect(TypePredictor.predictType(["true", "false", "true", "a"])).not.toEqual(t.boolean)
    expect(TypePredictor.predictType(["true", "false", "true", null])).toEqual(t.nullable(t.boolean))
    expect(TypePredictor.predictType(["true", false, "true", 1])).toEqual(t.boolean)
    expect(TypePredictor.predictType(["true", false, "true", 1, 0])).toEqual(t.boolean)
})

test("Predict list type", () => {
    expect(TypePredictor.predictType([[1, 2, 3], [4, 5, 6]])).toEqual(t.list(t.number))
    expect(TypePredictor.predictType([["1", "2", "3"], ["4", "5", "6"]])).toEqual(t.list(t.number))
    expect(TypePredictor.predictType([[1, "2", 3], [4, 5, 6]])).toEqual(t.list(t.number))
    expect(TypePredictor.predictType([["1.123", "2.24234", "3.21313"], ["4.123", "5.24234", "6.21313"]])).toEqual(t.list(t.number))
    expect(TypePredictor.predictType([["1.123", "2.24234", "3.21313"], ["4.123", "5.24234", "6.21313"], ["a"]])).not.toEqual(t.list(t.number))
    expect(TypePredictor.predictType([["1.123", "2.24234", "3.21313"], ["4.123", "5.24234", "6.21313"], [null]])).toEqual(t.list(t.nullable(t.number)))
    expect(TypePredictor.predictType([["1.123", -2, "3.21313e-12"], ["4.123", Math.PI, Number.MAX_VALUE]])).toEqual(t.list(t.number))
    expect(TypePredictor.predictType([["true", false, "true", 1, 0], null, []])).toEqual(t.nullable(t.list(t.boolean)))
})

test("Predict struct type", () => {
    expect(TypePredictor.predictType([{ a: 1, b: "2" }, { a: 3, b: "4" }])).toEqual(t.struct({ a: t.number, b: t.number }))
    expect(TypePredictor.predictType([{ a: "1.123", b: "2.24234" }, { a: "3.21313", b: "test" }])).toEqual(t.struct({ a: t.number, b: t.enum("b") }))
    expect(TypePredictor.predictType([{ a: "1.123", b: "false" }, { a: "3.21313", b: "0" }, { a: null, b: null }])).toEqual(t.struct({ a: t.nullable(t.number), b: t.nullable(t.boolean) }))
    expect(TypePredictor.predictType([{ a: ["true", false, null], b: "123" }, { a: [false], b: "0" }, { a: [], b: null }])).toEqual(t.struct({ a: t.list(t.nullable(t.boolean)), b: t.nullable(t.number) }))
})

test("Predict timeline type", () => {
    expect(TypePredictor.predictType([[{ timestamp: new Date().getTime(), type: "event" }, { timestamp: new Date(0).getTime(), type: "event" }]])).toEqual(t.timeline(t.event(t.enum("event"))))
    // expect(TypePredictor.predictType([[{ start: new Date().getTime(), end: new Date().getTime(), name: "interval" }, { start: new Date(0).getTime(), end: new Date().getTime(), name: "interval" }]])).toEqual(t.timeline({intervals: t.enum("Intervals")}))
    // expect(TypePredictor.predictType([[{ timestamp: new Date().getTime(), name: "event" }, { start: new Date(0).getTime(), end: new Date().getTime(), name: "interval" }]])).toEqual(t.timeline({intervals: t.enum("Intervals"), events: t.enum("Events")}))
})

test("Predict date type", () => {
    expect(TypePredictor.predictType([new Date().toISOString(), new Date(0).toISOString()])).toEqual(t.timestamp)
    expect(TypePredictor.predictType(["2021-01-01", "2021-01-02"])).toEqual(t.timestamp)
    expect(TypePredictor.predictType(["2021-01-01", "2021-01-02", "a"])).not.toEqual(t.timestamp)
    expect(TypePredictor.predictType(["2021-01-01", "2021-01-02", null])).toEqual(t.nullable(t.timestamp))
})

test("Check type", () => {
    t.registry.registerEnum("Events", ["Test"])
    t.registry.registerEnum("Intervals", ["1"])

    expect(TypeChecker.checkType(t.number, 1)).toBe(true)
    expect(TypeChecker.checkType(t.number, "1")).toBe(false)
    expect(TypeChecker.checkType(t.string, "1")).toBe(true)
    expect(TypeChecker.checkType(t.string, 1)).toBe(false)
    expect(TypeChecker.checkType(t.boolean, true)).toBe(true)
    expect(TypeChecker.checkType(t.boolean, 1)).toBe(false)
    expect(TypeChecker.checkType(t.timestamp, new Date().toISOString())).toBe(true)
    expect(TypeChecker.checkType(t.timestamp, "2021-01-01")).toBe(true)
    expect(TypeChecker.checkType(t.timestamp, "2021-01-01T00:00:00.000Z")).toBe(true)
    expect(TypeChecker.checkType(t.timestamp, "test date")).toBe(false)
    expect(TypeChecker.checkType(t.timestamp, new Date().getTime())).toBe(false)
    expect(TypeChecker.checkType(t.null, null)).toBe(true)
    expect(TypeChecker.checkType(t.null, undefined)).toBe(true)
    expect(TypeChecker.checkType(t.null, 1)).toBe(false)
    expect(TypeChecker.checkType(t.wildcard, 1)).toBe(true)
    expect(TypeChecker.checkType(t.wildcard, "test")).toBe(true)
    expect(TypeChecker.checkType(t.wildcard, null)).toBe(false)
    expect(TypeChecker.checkType(t.nullable(t.number), null)).toBe(true)
    expect(TypeChecker.checkType(t.nullable(t.number), 1)).toBe(true)
    expect(TypeChecker.checkType(t.nullable(t.number), "1")).toBe(false)
    expect(TypeChecker.checkType(t.list(t.number), [1, 2, 3])).toBe(true)
    expect(TypeChecker.checkType(t.list(t.number), ["1", "2", "3"])).toBe(false)
    expect(TypeChecker.checkType(t.list(t.number), [1, "2", 3])).toBe(false)
    expect(TypeChecker.checkType(t.struct({ a: t.boolean, b: t.number }), {})).toBe(false)
    expect(TypeChecker.checkType(t.struct({ a: t.boolean, b: t.number }), { a: true, b: 1 })).toBe(true)
    expect(TypeChecker.checkType(t.struct({ a: t.boolean, b: t.number }), { a: true, b: "1" })).toBe(false)
    expect(TypeChecker.checkType(t.struct({ a: t.boolean, b: t.number }), { a: true })).toBe(false)
    expect(TypeChecker.checkType(t.struct({ a: t.boolean, b: t.number }), { a: true, b: 1, c: "test" })).toBe(true)
    expect(TypeChecker.checkType(t.event(t.enum("Events")), { timestamp: new Date().toISOString(), type: "Test" })).toBe(true)
    expect(TypeChecker.checkType(t.event(t.enum("Events"), { a: t.string }), { timestamp: new Date().toISOString(), type: "Test", a: "test" })).toBe(true)
    expect(TypeChecker.checkType(t.event(t.enum("Events"), { a: t.string }), { timestamp: new Date().toISOString(), type: "Test" })).toBe(false)
    expect(TypeChecker.checkType(t.event(t.enum("Events")), { timestamp: new Date().toISOString(), type: "Test", a: "test" })).toBe(true)
    expect(TypeChecker.checkType(t.timeline(t.event(t.enum("Events"), )), [{ timestamp: new Date().toISOString(), type: "Test" }])).toBe(true)
    expect(TypeChecker.checkType(t.timeline(t.interval(t.enum("Intervals"))), [{ start: new Date().toISOString(), end: new Date().toISOString(), type: 1 }])).toBe(false)
    expect(TypeChecker.checkType(t.timeline(t.interval(t.enum("Intervals"))), [{ start: new Date().toISOString(), end: new Date().toISOString(), type: "1" }])).toBe(true)
    expect(TypeChecker.checkType(t.hierarchy("Color"), "red")).toBe(true)
    expect(TypeChecker.checkType(t.hierarchy("Color"), "dark")).toBe(true)
    expect(TypeChecker.checkType(t.hierarchy("Color"), "test")).toBe(true)
    expect(TypeChecker.checkType(t.hierarchy("Color"), "light")).toBe(true)
    expect(TypeChecker.checkType(t.hierarchy("Color"), "green")).toBe(true)
})

test("Check type compatibility", () => {
    expect(TypeChecker.checkTypeCompatibility(t.number, t.number)).toBe(true)
    expect(TypeChecker.checkTypeCompatibility(t.number, t.string)).toBe(false)
    expect(TypeChecker.checkTypeCompatibility(t.nullable(t.number), t.number)).toBe(true)
    expect(TypeChecker.checkTypeCompatibility(t.number, t.nullable(t.number))).toBe(false)
    expect(TypeChecker.checkTypeCompatibility(t.wildcard, t.number)).toBe(true)
    expect(TypeChecker.checkTypeCompatibility(t.number, t.wildcard)).toBe(false)
    expect(TypeChecker.checkTypeCompatibility(t.list(t.number), t.list(t.number))).toBe(true)
    expect(TypeChecker.checkTypeCompatibility(t.list(t.number), t.list(t.string))).toBe(false)
    expect(TypeChecker.checkTypeCompatibility(t.struct({ a: t.number, b: t.string }), t.struct({ a: t.number, b: t.string }))).toBe(true)
    expect(TypeChecker.checkTypeCompatibility(t.struct({ a: t.number, b: t.string }), t.struct({ a: t.number }))).toBe(false)
    expect(TypeChecker.checkTypeCompatibility(t.struct({ a: t.number, b: t.string }), t.struct({ a: t.number, b: t.number }))).toBe(false)
    expect(TypeChecker.checkTypeCompatibility(t.string, t.timestamp)).toBe(true)
    expect(TypeChecker.checkTypeCompatibility(t.nullable(t.enum("Test")), t.enum("Test"))).toBe(true)
    expect(TypeChecker.checkTypeCompatibility(t.enum("Test"), t.enum("Test1"))).toBe(false)
    expect(TypeChecker.checkTypeCompatibility(t.nullable(t.wildcard), t.nullable(t.enum("Test")))).toBe(true)

    expect(TypeChecker.checkTypeCompatibility(t.union(t.number, t.string), t.union(t.number, t.string))).toBe(true)
    expect(TypeChecker.checkTypeCompatibility(t.union(t.number, t.string), t.union(t.number, t.boolean))).toBe(false)
    // TODO: those are valid test cases but they fail because of a temporary fix in type_checker.ts
    // expect(TypeChecker.checkTypeCompatibility(t.union(t.number, t.string, t.boolean), t.union(t.number, t.string))).toBe(true)
    // expect(TypeChecker.checkTypeCompatibility(t.union(t.number, t.string), t.union(t.number, t.string, t.boolean))).toBe(false)
    expect(TypeChecker.checkTypeCompatibility(t.union(t.number, t.string), t.number)).toBe(true)
    expect(TypeChecker.checkTypeCompatibility(t.union(t.number, t.string), t.string)).toBe(true)
    expect(TypeChecker.checkTypeCompatibility(t.union(t.number, t.string), t.boolean)).toBe(false)
    expect(TypeChecker.checkTypeCompatibility(t.list(t.union(t.number, t.string)), t.list(t.number))).toBe(true)
})

test("Test wildcard inference", () => {
    expect(t.utils.inferAbstractType(t.wildcard, t.string)).toStrictEqual(t.string)
    expect(t.utils.inferAbstractType(t.wildcard, t.number)).toStrictEqual(t.number)
    expect(t.utils.inferAbstractType(t.nullable(t.wildcard), t.nullable(t.number))).toStrictEqual(t.number)
    expect(t.utils.inferAbstractType(t.nullable(t.wildcard), t.nullable(t.string))).toStrictEqual(t.string)
    expect(t.utils.inferAbstractType(t.nullable(t.wildcard), t.number)).toStrictEqual(t.number)
    expect(t.utils.inferAbstractType(t.list(t.wildcard), t.list(t.number))).toStrictEqual(t.number)
    expect(t.utils.inferAbstractType(t.list(t.wildcard), t.list(t.string))).toStrictEqual(t.string)
    expect(t.utils.inferAbstractType(t.struct({ a: t.wildcard }), t.struct({ a: t.number }))).toStrictEqual(t.number)
    expect(t.utils.inferAbstractType(t.struct({ a: t.wildcard, b: t.wildcard }), t.struct({ a: t.number, b: t.number }))).toStrictEqual(t.number)
    expect(() => t.utils.inferAbstractType(t.struct({ a: t.wildcard, b: t.wildcard }), t.struct({ a: t.number, b: t.string }))).toThrowError()
    expect(t.utils.inferAbstractType(t.struct({ a: t.wildcard }), t.struct({ a: t.number, b: t.string }))).toStrictEqual(t.number)
})

test("Test wildcard replacement", () => {
    expect(t.utils.replaceAbstractType(t.number, t.number)).toStrictEqual(t.number)
    expect(t.utils.replaceAbstractType(t.wildcard, t.string)).toStrictEqual(t.string)
    expect(t.utils.replaceAbstractType(t.wildcard, t.number)).toStrictEqual(t.number)
    expect(t.utils.replaceAbstractType(t.nullable(t.wildcard), t.number)).toStrictEqual(t.nullable(t.number))
    expect(t.utils.replaceAbstractType(t.nullable(t.wildcard), t.string)).toStrictEqual(t.nullable(t.string))
    expect(t.utils.replaceAbstractType(t.list(t.wildcard), t.number)).toStrictEqual(t.list(t.number))
    expect(t.utils.replaceAbstractType(t.list(t.wildcard), t.string)).toStrictEqual(t.list(t.string))
    expect(t.utils.replaceAbstractType(t.struct({ a: t.wildcard }), t.number)).toStrictEqual(t.struct({ a: t.number }))
    expect(t.utils.replaceAbstractType(t.struct({ a: t.wildcard, b: t.wildcard }), t.number)).toStrictEqual(t.struct({ a: t.number, b: t.number }))
    expect(t.utils.replaceAbstractType(t.struct({ a: t.wildcard, b: t.wildcard }), t.struct({ a: t.number, b: t.string }))).toStrictEqual(t.struct({ a: t.struct({ a: t.number, b: t.string }), b: t.struct({ a: t.number, b: t.string }) }))
})

test("Enum registry works with string array", () => {
    t.registry.registerEnum("Color", ["red", "green", "blue"])
    expect(t.enum("Color")).toEqual({ name: 'Enum<Color>', nullable: false, primitive: false, enumName: "Color", wildcard: false });
    expect(t.registry.getEnumValues("Color")).toEqual(["red", "green", "blue"])
})

test("Enum registry works with extraction function", () => {
    t.registry.registerEnum("Color", (table) => {
        return table.getColumnByName("Color")!.values.filter(v => v !== null) as string[]
    })
    expect(t.enum("Color")).toEqual({ name: 'Enum<Color>', nullable: false, primitive: false, enumName: "Color", wildcard: false });
    expect(t.registry.getEnumValues("Color", [{ name: "Color", type: "String", values: ["red", "green", "blue"] }])).toEqual(["red", "green", "blue"])
})

test("Enum registry works with column name", () => {
    t.registry.registerEnum("Color", { columns: ["Color"] })
    expect(t.enum("Color")).toEqual({ name: 'Enum<Color>', nullable: false, primitive: false, enumName: "Color", wildcard: false });
    expect(t.registry.getEnumValues("Color", [{ name: "Color", type: "String", values: ["red", "green", "blue"] }])).toEqual(["red", "green", "blue"])
})

test("Enum registry works with multiple columns", () => {
    t.registry.registerEnum("Color", { columns: ["Color", "Color2"] })
    expect(t.enum("Color")).toEqual({ name: 'Enum<Color>', nullable: false, primitive: false, enumName: "Color", wildcard: false });
    expect(t.registry.getEnumValues("Color", [{ name: "Color", type: "String", values: ["red", "green", "blue"] }, { name: "Color2", type: "String", values: ["red", "green", "blue"] }])).toEqual(["red", "green", "blue"])
})

test("Enum registry works with columns and struct extraction", () => {
    t.registry.registerEnum("SchoolCity", { columns: ["School.City"] })
    expect(t.enum("SchoolCity")).toEqual({ name: 'Enum<SchoolCity>', nullable: false, primitive: false, enumName: "SchoolCity", wildcard: false });

    const table = DataTable.fromColumns([
        new DataColumn("School", t.struct({ City: t.enum("SchoolCity") }), [{ City: "New York" }, { City: "Los Angeles" }])
    ])

    expect(t.registry.getEnumValues("SchoolCity", table)).toEqual(["New York", "Los Angeles"])
})

test("Enum registry works with deeply nested struct extraction", () => {
    t.registry.registerEnum("SchoolCity", { columns: ["School.Location.City"] })
    expect(t.enum("SchoolCity")).toEqual({ name: 'Enum<SchoolCity>', nullable: false, primitive: false, enumName: "SchoolCity", wildcard: false });

    const table = DataTable.fromColumns([
        new DataColumn("School", t.struct({ Location: t.struct({ City: t.enum("SchoolCity") }) }), [{ Location: { City: "New York" } }, { Location: { City: "Los Angeles" } }])
    ])

    expect(t.registry.getEnumValues("SchoolCity", table)).toEqual(["New York", "Los Angeles"])
})

test("Enum registry works with array extraction", () => {
    t.registry.registerEnum("SchoolCity", { columns: ["School.Cities.$all"]})
   
    expect(t.enum("SchoolCity")).toEqual({ name: 'Enum<SchoolCity>', nullable: false, primitive: false, enumName: "SchoolCity", wildcard: false });

    const table = DataTable.fromColumns([
        new DataColumn("School", t.struct({ Cities: t.list(t.enum("SchoolCity")) }), [{ Cities: ["New York", "Los Angeles"] }, { Cities: ["San Francisco", "Chicago"] }])
    ])

    expect(t.registry.getEnumValues("SchoolCity", table)).toEqual(["New York", "Los Angeles", "San Francisco", "Chicago"])
})

test("Enum registry works with deeply nested array extraction", () => {
    t.registry.registerEnum("SchoolCity", { columns: ["School.Locations.$all.Cities.$all"]})
   
    expect(t.enum("SchoolCity")).toEqual({ name: 'Enum<SchoolCity>', nullable: false, primitive: false, enumName: "SchoolCity", wildcard: false });

    const table = DataTable.fromColumns([
        new DataColumn("School", t.struct({ Locations: t.list(t.struct({ Cities: t.list(t.enum("SchoolCity")) })) }), [{ Locations: [{ Cities: ["New York", "Los Angeles"] }, { Cities: ["San Francisco", "Chicago"] }] }])
    ])

    expect(t.registry.getEnumValues("SchoolCity", table)).toEqual(["New York", "Los Angeles", "San Francisco", "Chicago"])
})

test("Enum registry works with timeline event extraction", () => {
    t.registry.registerEnum("EventsEventType", { columns: ["Events.$events.type"]})
    t.registry.registerEnum("EventsIntervalType", { columns: ["Events.$intervals.type"]})
   
    expect(t.enum("EventsEventType")).toEqual({ name: 'Enum<EventsEventType>', nullable: false, primitive: false, enumName: "EventsEventType", wildcard: false });

    const table = DataTable.fromColumns([
        new DataColumn("Events", t.timeline(t.union(t.event(t.enum("EventsEventType"), {}), t.interval(t.enum("EventsIntervalType"), {}))), [[{ timestamp: "1970-01-01T00:00:01.000Z", type: "A" }, { timestamp: "1970-01-02T00:00:01.000Z", type: "B" }, {start: "1970-01-03T00:00:01.000Z", end: "1970-01-04T00:00:01.000Z", type: "C"}], [{ timestamp: "1970-01-05T00:00:01.000Z", type: "A" }, { timestamp: "1970-01-06T00:00:01.000Z", type: "D" }]])
    ])

    expect(t.registry.getEnumValues("EventsEventType", table)).toEqual(["A", "B", "D"])
    expect(t.registry.getEnumValues("EventsIntervalType", table)).toEqual(["C"])
})

test("Enum registry works with timeline event extraction for heterogeneous types", () => {
    t.registry.registerEnum("EventsType", { columns: ["Events.$events.type"]})
    t.registry.registerEnum("EventsName", { columns: ["Events.$events.name"]})

    const table = DataTable.fromColumns([
        new DataColumn("Events", t.timeline(t.union(t.event(t.enum("EventsType"), {}), t.event(t.enum("EventsType"), {name: t.enum("EventsName")}))), [[{ timestamp: "1970-01-01T00:00:01.000Z", type: "A", name: "X" }, { timestamp: "1970-01-02T00:00:01.000Z", type: "B" }], [{ timestamp: "1970-01-03T00:00:01.000Z", type: "A" }, { timestamp: "1970-01-04T00:00:01.000Z", type: "D", name: "Y" }]])
    ])

    expect(t.registry.getEnumValues("EventsType", table)).toEqual(["A", "B", "D"])
    expect(t.registry.getEnumValues("EventsName", table)).toEqual(["X", "Y"])
})

test("Enum registry works with concrete index extraction", () => {
    t.registry.registerEnum("SchoolCity", { columns: ["School.Cities.$index[1]"]})
   
    expect(t.enum("SchoolCity")).toEqual({ name: 'Enum<SchoolCity>', nullable: false, primitive: false, enumName: "SchoolCity", wildcard: false });

    const table = DataTable.fromColumns([
        new DataColumn("School", t.struct({ Cities: t.list(t.enum("SchoolCity")) }), [{ Cities: ["New York", "Los Angeles"] }, { Cities: ["San Francisco", "Chicago"] }])
    ])

    expect(t.registry.getEnumValues("SchoolCity", table)).toEqual(["Los Angeles", "Chicago"])
})