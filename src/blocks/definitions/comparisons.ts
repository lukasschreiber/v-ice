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
    code: (scope) => {
        return {
            operation: "equals_within",
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B"),
                delta: scope.buildASTForInput("DELTA")
            }
        }
    }
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
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
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
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return {
            operation: "matches",
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        }
    }
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
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return {
            operation: "greater",
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        }
    }
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
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return {
            operation: "less",
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        }
    }
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
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return {
            operation: "less_equals",
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        }
    }
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
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return {
            operation: "greater_equals",
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        }
    }
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
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return {
            operation: "compare_numbers",
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B"),
                operator: scope.buildASTForField("OP")
            }
        }
    }
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
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return {
            operation: "compare_interval",
            args: {
                a: scope.buildASTForInput("A"),
                min: scope.buildASTForInput("B"),
                max: scope.buildASTForInput("C")
            }
        }
    }
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
    inputsInline: true,
    code: (scope) => {
        return {
            operation: "is_null",
            args: {
                a: scope.buildASTForInput("A")
            }
        }
    }
})
