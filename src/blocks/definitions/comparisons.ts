import { Colors } from "@/themes/colors";
import { ConnectionType, registerBlocksFromJsonArray } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Blocks } from "@/blocks";

export default registerBlocksFromJsonArray([
    {
        id: Blocks.Names.COMPARISON.EQUALS_WITHIN,
        message0: "%1 = %2 %{BKY_WITHIN} %3",
        args0: [
            {
                type: "input_value",
                name: "A",
                check: t.nullable(t.union(t.number , t.timestamp))
            },
            {
                type: "input_value",
                name: "B",
                check: t.nullable(t.union(t.number , t.timestamp))
            },
            {
                type: "input_value",
                name: "DELTA",
                check: t.nullable(t.number)
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        helpUrl: "#equals-within",
        colour: Colors.categories.comparisons,
        inputsInline: true,
        mutator: "dynamic_input_types"
    },
    {
        id: Blocks.Names.COMPARISON.EQUALS,
        message0: "%1 = %2",
        args0: [
            {
                type: "input_value",
                name: "A",
                check: t.nullable(t.wildcard)
            },
            {
                type: "input_value",
                name: "B",
                check: t.nullable(t.wildcard)
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        colour: Colors.categories.comparisons,
        inputsInline: true,
        helpUrl: "#equals",
        mutator: "dynamic_input_types"
    },
    {
        id: Blocks.Names.COMPARISON.MATCHES,
        message0: "%1 %{BKY_MATCHES} %2",
        args0: [
            {
                type: "input_value",
                name: "A",
                check: t.nullable(t.wildcard)
            },
            {
                type: "input_value",
                name: "B",
                check: t.nullable(t.wildcard)
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        colour: Colors.categories.comparisons,
        inputsInline: true,
        helpUrl: "#matches",
        mutator: "dynamic_input_types"
    },
    {
        id: Blocks.Names.COMPARISON.GREATER,
        message0: "%1 > %2",
        args0: [
            {
                type: "input_value",
                name: "A",
                check: t.nullable(t.union(t.number, t.timestamp)),
            },
            {
                type: "input_value",
                name: "B",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        colour: Colors.categories.comparisons,
        helpUrl: "#comparison-numbers",
        inputsInline: true,
        mutator: "dynamic_input_types"
    },
    {
        id: Blocks.Names.COMPARISON.LESS,
        message0: "%1 < %2",
        args0: [
            {
                type: "input_value",
                name: "A",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
            {
                type: "input_value",
                name: "B",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        helpUrl: "#comparison-numbers",
        colour: Colors.categories.comparisons,
        inputsInline: true,
        mutator: "dynamic_input_types"
    },
    {
        id: Blocks.Names.COMPARISON.LESS_EQUALS,
        message0: "%1 ≤ %2",
        args0: [
            {
                type: "input_value",
                name: "A",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
            {
                type: "input_value",
                name: "B",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        helpUrl: "#comparison-numbers",
        colour: Colors.categories.comparisons,
        inputsInline: true,
        mutator: "dynamic_input_types"
    },
    {
        id: Blocks.Names.COMPARISON.GREATER_EQUALS,
        message0: "%1 ≥ %2",
        args0: [
            {
                type: "input_value",
                name: "A",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
            {
                type: "input_value",
                name: "B",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        helpUrl: "#comparison-numbers",
        colour: Colors.categories.comparisons,
        inputsInline: true,
        mutator: "dynamic_input_types"
    },
    {
        id: Blocks.Names.COMPARISON.NUMBERS,
        message0: "%1 %2 %3",
        args0: [
            {
                type: "input_value",
                name: "A",
                check: t.nullable(t.union(t.number, t.timestamp)),
            },
            {
                type: "field_dropdown",
                name: "OP",
                options: [
                    ["<", "LESS"],
                    [">", "GREATER"],
                    ["≤", "LEQ"],
                    ["≥", "GEQ"]
                ]
            },
            {
                type: "input_value",
                name: "B",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        colour: Colors.categories.comparisons,
        helpUrl: "#comparison-numbers",
        inputsInline: true,
        mutator: "dynamic_input_types"
    },
    {
        id: Blocks.Names.COMPARISON.INTERVAL,
        message0: "%1 %{BKY_BETWEEN} %2 %{BKY_AND} %3",
        args0: [
            {
                type: "input_value",
                name: "A",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
            {
                type: "input_value",
                name: "B",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
            {
                type: "input_value",
                name: "C",
                check: t.nullable(t.union(t.number, t.timestamp))
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        colour: Colors.categories.comparisons,
        helpUrl: "#comparison-interval",
        inputsInline: true,
        mutator: "dynamic_input_types"
    },
    {
        id: Blocks.Names.COMPARISON.NULL,
        message0: "%1 %{BKY_IS_NULL}",
        args0: [
            {
                type: "input_value",
                name: "A",
                check: t.nullable(t.wildcard)
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        colour: Colors.categories.comparisons,
        helpUrl: "#comparison-null",
        inputsInline: true
    },
] as const)