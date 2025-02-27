import { ConnectionType, createBlock } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Blocks } from "@/blocks";
import { DynamicInputTypesMutator } from "../mutators/dynamic_input_types";
import { ASTNodeKind, createASTNode } from "@/query/builder/ast";
import { HasVariableMutator } from "../mutators/has_variable";

export const EqualsWithinBlock = createBlock({
    id: Blocks.Names.COMPARISON.EQUALS_WITHIN,
    lines: [
        {
            // text: (args, t) => `${args("A")} = ${args("B")} ${t("WITHIN")} ${args("DELTA")}`,
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
        },
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    helpUrl: "#equals-within",
    style: "comparisons_blocks",
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "equals_within",
            type: t.boolean,
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B"),
                delta: scope.buildASTForInput("DELTA")
            }
        })
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
    style: "comparisons_blocks",
    inputsInline: true,
    helpUrl: "#equals",
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "equals",
            type: t.boolean,
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        })
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
    style: "comparisons_blocks",
    inputsInline: true,
    helpUrl: "#matches",
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "matches",
            type: t.boolean,
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        })
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
    style: "comparisons_blocks",
    helpUrl: "#comparison-numbers",
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "compare_numbers",
            type: t.boolean,
            args: {
                operator: createASTNode(ASTNodeKind.Primitive, null, {
                    value: "GREATER",
                    type: t.string
                }),
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        })
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
    style: "comparisons_blocks",
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "compare_numbers",
            type: t.boolean,
            args: {
                operator: createASTNode(ASTNodeKind.Primitive, null, {
                    value: "LESS",
                    type: t.string
                }),
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        })
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
    style: "comparisons_blocks",
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "compare_numbers",
            type: t.boolean,
            args: {
                operator: createASTNode(ASTNodeKind.Primitive, null, {
                    value: "LEQ",
                    type: t.string
                }),
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        })
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
    style: "comparisons_blocks",
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "compare_numbers",
            type: t.boolean,
            args: {
                operator: createASTNode(ASTNodeKind.Primitive, null, {
                    value: "GEQ",
                    type: t.string
                }),
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B")
            }
        })
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
    style: "comparisons_blocks",
    helpUrl: "#comparison-numbers",
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "compare_numbers",
            type: t.boolean,
            args: {
                a: scope.buildASTForInput("A"),
                b: scope.buildASTForInput("B"),
                operator: scope.buildASTForField("OP", value => value, t.string)
            }
        })
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
    style: "comparisons_blocks",
    helpUrl: "#comparison-interval",
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "compare_interval",
            type: t.boolean,
            args: {
                a: scope.buildASTForInput("A"),
                min: scope.buildASTForInput("B"),
                max: scope.buildASTForInput("C")
            }
        })
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
    style: "comparisons_blocks",
    helpUrl: "#comparison-null",
    inputsInline: true,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "is_null",
            type: t.boolean,
            args: {
                a: scope.buildASTForInput("A")
            }
        })
    }
})

export const HasVariableValueBlock = createBlock({
    id: Blocks.Names.VARIABLE.HAS,
    lines: [
        {
            text: "%{BKY_HAS_VALUE} %1",
            args: [
                {
                    type: 'field_dynamic_dropdown',
                    name: 'VAR',
                    options: [
                        ["", ""],
                    ],
                },
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    style: "variable_blocks",
    helpUrl: "#variables",
    mutator: HasVariableMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "has_variable",
            type: t.boolean,
            args: {
                name: createASTNode(ASTNodeKind.Primitive, null, { value: scope.getFieldValue("VAR"), type: t.string }),
            }
        })
    }
})