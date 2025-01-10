import { Blocks } from "@/blocks";
import { ConnectionType, registerBlocks } from "@/blocks/block_definitions";
import t from "@/data/types"
import { DivisiblebyMutator } from "../mutators/math_is_divisibleby";
import { DynamicInputTypesMutator } from "../mutators/dynamic_input_types";

export default registerBlocks([
    {
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
        ],
        output: t.number,
        helpUrl: "#math-operations",
        style: "math_blocks",
        inputsInline: true,
        mutator: DynamicInputTypesMutator
    },
    {
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
        ],
        output: t.number,
        style: "math_blocks",
        helpUrl: "#math-operations",
        inputsInline: true,
    },
    {
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
        ],
        output: t.number,
        style: "math_blocks",
        helpUrl: "#math-operations",
        inputsInline: true,
    },
    {
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
        ],
        output: t.number,
        style: "math_blocks",
        helpUrl: "#math-operations",
        inputsInline: true,
    },
    {
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
        ],
        output: t.number,
        style: "math_blocks",
    },
    {
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
        ],
        output: t.number,
        helpUrl: "#math-binary-operations",
        style: "math_blocks",
        inputsInline: true,
    },
    {
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
        ],
        connectionType: ConnectionType.BOOLEAN,
        style: "math_blocks",
        helpUrl: "#math-properties",
        // the mutator is a default blockly mutator
        mutator: DivisiblebyMutator
    },
    {
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
        ],
        output: t.number,
        helpUrl: "#math-functions",
        style: "math_blocks",
    },
    {
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
        ],
        output: t.number,
        style: "math_blocks",
        helpUrl: "#math-constants",
    },
    {
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
        ],
        output: t.number,
        style: "math_blocks",
        helpUrl: "#math-constrain",
        inputsInline: true,
    }
] as const)