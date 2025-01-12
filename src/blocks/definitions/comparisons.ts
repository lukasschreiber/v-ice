import { Colors } from "@/themes/colors";
import { ConnectionType, createBlock } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Blocks } from "@/blocks";
import { DynamicInputTypesMutator } from "../mutators/dynamic_input_types";

export const EqualsWithinBlock = createBlock({
    id: Blocks.Names.COMPARISON.EQUALS_WITHIN,
    lines: [
        {
            text: "%1 = %2 %{BKY_WITHIN} %3",
            args: [
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
                    name: "DELTA",
                    check: t.nullable(t.number)
                },
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    helpUrl: "#equals-within",
    color: Colors.categories.comparisons,
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
})

export const EqualsBlock = createBlock({
    id: Blocks.Names.COMPARISON.EQUALS,
    lines: [
        {
            text: "%1 = %2",
            args: [
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
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    color: Colors.categories.comparisons,
    inputsInline: true,
    helpUrl: "#equals",
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return {
            operation: "equals",
            args: {
                a: scope.generateForInput("A"),
                b: scope.generateForInput("B")
            }
        }
    }
})

export const MatchesBlock = createBlock({
    id: Blocks.Names.COMPARISON.MATCHES,
    lines: [
        {
            text: "%1 %{BKY_MATCHES} %2",
            args: [
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
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    color: Colors.categories.comparisons,
    inputsInline: true,
    helpUrl: "#matches",
    mutator: DynamicInputTypesMutator
})

export const GreaterBlock = createBlock({
    id: Blocks.Names.COMPARISON.GREATER,
    lines: [
        {
            text: "%1 > %2",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.nullable(t.union(t.number, t.timestamp))
                },
                {
                    type: "input_value",
                    name: "B",
                    check: t.nullable(t.union(t.number, t.timestamp))
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    color: Colors.categories.comparisons,
    helpUrl: "#comparison-numbers",
    inputsInline: true,
    mutator: DynamicInputTypesMutator
})

export const LessBlock = createBlock({
    id: Blocks.Names.COMPARISON.LESS,
    lines: [
        {
            text: "%1 < %2",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.nullable(t.union(t.number, t.timestamp))
                },
                {
                    type: "input_value",
                    name: "B",
                    check: t.nullable(t.union(t.number, t.timestamp))
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    helpUrl: "#comparison-numbers",
    color: Colors.categories.comparisons,
    inputsInline: true,
    mutator: DynamicInputTypesMutator
})

export const LessEqualsBlock = createBlock({
    id: Blocks.Names.COMPARISON.LESS_EQUALS,
    lines: [
        {
            text: "%1 ≤ %2",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.nullable(t.union(t.number, t.timestamp))
                },
                {
                    type: "input_value",
                    name: "B",
                    check: t.nullable(t.union(t.number, t.timestamp))
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    helpUrl: "#comparison-numbers",
    color: Colors.categories.comparisons,
    inputsInline: true,
    mutator: DynamicInputTypesMutator
})

export const GreaterEqualsBlock = createBlock({
    id: Blocks.Names.COMPARISON.GREATER_EQUALS,
    lines: [
        {
            text: "%1 ≥ %2",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.nullable(t.union(t.number, t.timestamp))
                },
                {
                    type: "input_value",
                    name: "B",
                    check: t.nullable(t.union(t.number, t.timestamp))
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    helpUrl: "#comparison-numbers",
    color: Colors.categories.comparisons,
    inputsInline: true,
    mutator: DynamicInputTypesMutator
})

export const CompareNumbersBlock = createBlock({
    id: Blocks.Names.COMPARISON.NUMBERS,
    lines: [
        {
            text: "%1 %2 %3",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.nullable(t.union(t.number, t.timestamp))
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
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    color: Colors.categories.comparisons,
    helpUrl: "#comparison-numbers",
    inputsInline: true,
    mutator: DynamicInputTypesMutator
})

export const CompareIntervalBlock = createBlock({
    id: Blocks.Names.COMPARISON.INTERVAL,
    lines: [
        {
            text: "%1 %{BKY_BETWEEN} %2 %{BKY_AND} %3",
            args: [
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
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    color: Colors.categories.comparisons,
    helpUrl: "#comparison-interval",
    inputsInline: true,
    mutator: DynamicInputTypesMutator
})

export const IsNullBlock = createBlock({
    id: Blocks.Names.COMPARISON.NULL,
    lines: [
        {
            text: "%1 %{BKY_IS_NULL}",
            args: [
                {
                    type: "input_value",
                    name: "A",
                    check: t.nullable(t.wildcard)
                },
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    color: Colors.categories.comparisons,
    helpUrl: "#comparison-null",
    inputsInline: true
})
