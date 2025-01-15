import { Blocks } from "@/blocks";
import { ConnectionType, createBlock } from "@/blocks/block_definitions";
import t from "@/data/types"
import { DivisiblebyMutator } from "../mutators/math_is_divisibleby";
import { DynamicInputTypesMutator } from "../mutators/dynamic_input_types";

export const MathMinusBlock = createBlock({
    id: Blocks.Names.MATH.MINUS,
    lines: [
        {
            text: "%1 - %2",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.union(t.number, t.timestamp)
                },
                {
                    type: "input_value",
                    name: "B",
                    check: t.union(t.number, t.timestamp)
                },
            ]
        }
    ] as const,
    output: t.number,
    helpUrl: "#math-operations",
    style: "math_blocks",
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return {
            operation: "binary_math_operation",
            args: {
                operator: {value: "SUBTRACTION"},
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B"),
            }
        }
    }
})

export const MathPlusBlock = createBlock({
    id: Blocks.Names.MATH.PLUS,
    lines: [
        {
            text: "%1 + %2",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.number
                },
                {
                    type: "input_value",
                    name: "B",
                    check: t.number
                },
            ]
        }
    ] as const,
    output: t.number,
    style: "math_blocks",
    helpUrl: "#math-operations",
    inputsInline: true,
    code: (scope) => {
        return {
            operation: "binary_math_operation",
            args: {
                operator: {value: "ADDITION"},
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B"),
            }
        }
    }
})

export const MathTimesBlock = createBlock({
    id: Blocks.Names.MATH.TIMES,
    lines: [
        {
            text: "%1 × %2",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.number
                },
                {
                    type: "input_value",
                    name: "B",
                    check: t.number
                },
            ]
        }
    ] as const,
    output: t.number,
    style: "math_blocks",
    helpUrl: "#math-operations",
    inputsInline: true,
    code: (scope) => {
        return {
            operation: "binary_math_operation",
            args: {
                operator: {value: "MULTIPLICATION"},
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B"),
            }
        }
    }
})

export const MathDividedByBlock = createBlock({
    id: Blocks.Names.MATH.DIVIDED_BY,
    lines: [
        {
            text: "%1 / %2",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.number
                },
                {
                    type: "input_value",
                    name: "B",
                    check: t.number
                },
            ]
        }
    ] as const,
    output: t.number,
    style: "math_blocks",
    helpUrl: "#math-operations",
    inputsInline: true,
    code: (scope) => {
        return {
            operation: "binary_math_operation",
            args: {
                operator: {value: "DIVISION"},
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B"),
            }
        }
    }
})

export const NumberBlock = createBlock({
    id: Blocks.Names.MATH.NUMBER,
    lines: [
        {
            text: "%1",
            args: [
                {
                    type: "field_number",
                    name: "NUM",
                    value: 0,
                },
            ]
        }
    ] as const,
    output: t.number,
    style: "math_blocks",
    code: (scope) => {
        return scope.buildASTForField("NUM", v => parseFloat(v || "0"))
    }
})

export const MathBinaryOperationBlock = createBlock({
    id: Blocks.Names.MATH.BINARY,
    lines: [
        {
            text: "%1 %2 %3",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.number
                },
                {
                    type: "field_dropdown",
                    name: "OP",
                    options: [
                        ["+", "ADDITION"],
                        ["-", "SUBTRACTION"],
                        ["/", "DIVISION"],
                        ["×", "MULTIPLICATION"],
                        ["^", "POWER"],
                        ["%", "MODULO"],
                    ]
                },
                {
                    type: "input_value",
                    name: "B",
                    check: t.number
                },
            ]
        }
    ] as const,
    output: t.number,
    helpUrl: "#math-binary-operations",
    style: "math_blocks",
    inputsInline: true,
    code: (scope) => {
        return {
            operation: "binary_math_operation",
            args: {
                operator: scope.buildASTForField("OP"),
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B"),
            }
        }
    }
})

export const MathNumberPropertyBlock = createBlock({
    id: Blocks.Names.MATH.NUMBER_PROPERTY,
    lines: [
        {
            text: "%1 %{BKY_IS} %2",
            args: [
                {
                    type: "input_value",
                    name: "NUM",
                    check: t.number
                },
                {
                    type: "field_dropdown",
                    name: "PROPERTY",
                    options: [
                        ["%{BKY_EVEN}", "EVEN"],
                        ["%{BKY_ODD}", "ODD"],
                        ["%{BKY_POSITIVE}", "POSITIVE"],
                        ["%{BKY_NEGATIVE}", "NEGATIVE"],
                        ["%{BKY_PRIME}", "PRIME"],
                        ["%{BKY_WHOLE}", "WHOLE"],
                        ["%{BKY_FRACTION}", "FRACTION"],
                        ["%{BKY_DIVISIBLE_BY}", "DIVISIBLE_BY"],
                    ]
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    style: "math_blocks",
    helpUrl: "#math-properties",
    mutator: DivisiblebyMutator,
    code: (scope) => {
        return {
            operation: "number_property",
            args: {
                property: scope.buildASTForField("PROPERTY"),
                a: scope.buildASTForInput("NUM"),
            }
        }
    }
})

export const MathUnaryOperationBlock = createBlock({
    id: Blocks.Names.MATH.UNARY,
    lines: [
        {
            text: "%1 %2",
            args: [
                {
                    type: "field_dropdown",
                    name: "OP",
                    options: [
                        ["%{BKY_SIN}", "SIN"],
                        ["%{BKY_COS}", "COS"],
                        ["%{BKY_TAN}", "TAN"],
                        ["%{BKY_ASIN}", "ASIN"],
                        ["%{BKY_ACOS}", "ACOS"],
                        ["%{BKY_ATAN}", "ATAN"],
                        ["%{BKY_EXP}", "EXP"],
                        ["%{BKY_LN}", "LOG"],
                        ["%{BKY_ABS}", "ABS"],
                        ["%{BKY_SQRT}", "SQRT"],
                        ["%{BKY_ROUND}", "ROUND"],
                        ["%{BKY_FLOOR}", "FLOOR"],
                        ["%{BKY_CEIL}", "CEIL"],
                    ],
                },
                {
                    type: "input_value",
                    name: "NUM",
                    check: t.number
                },
            ]
        }
    ] as const,
    output: t.number,
    helpUrl: "#math-functions",
    style: "math_blocks",
    inputsInline: true,
    code: (scope) => {
        return {
            operation: "unary_math_operation",
            args: {
                operator: scope.buildASTForField("OP"),
                a: scope.buildASTForInput("NUM"),
            }
        }
    }
})

export const MathConstantsBlock = createBlock({
    id: Blocks.Names.MATH.CONSTANTS,
    lines: [
        {
            text: "%1",
            args: [
                {
                    type: "field_dropdown",
                    name: "CONSTANT",
                    options: [
                        ['\u03c0', 'PI'],
                        ['e', 'E'],
                        ['\u03c6', 'GOLDEN_RATIO'],
                        ['\u221e', 'INFINITY'],
                    ]
                }
            ]
        }
    ] as const,
    output: t.number,
    style: "math_blocks",
    helpUrl: "#math-constants",
    code: (scope) => {
        return scope.buildASTForField("CONSTANT")
    }
})

export const MathConstrainBlock = createBlock({
    id: Blocks.Names.MATH.CONSTRAIN,
    lines: [
        {
            text: "%{BKY_CONSTRAIN}",
            args: [
                {
                    type: "input_value",
                    name: "NUM",
                    check: t.number
                },
                {
                    type: "input_value",
                    name: "LOW",
                    check: t.number
                },
                {
                    type: "input_value",
                    name: "HIGH",
                    check: t.number
                },
            ]
        }
    ] as const,
    output: t.number,
    style: "math_blocks",
    helpUrl: "#math-constrain",
    inputsInline: true,
    code: (scope) => {
        return {
            operation: "constrain",
            args: {
                a: scope.buildASTForInput("NUM"),
                low: scope.buildASTForInput("LOW"),
                high: scope.buildASTForInput("HIGH"),
            }
        }
    }
})
