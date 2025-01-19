import { Blocks } from "@/blocks";
import { ConnectionType, createBlock } from "../block_definitions";
import t from "@/data/types";
import { ParentColorExtension } from "../extensions/parent_color";
import { FlattenListExtension } from "../extensions/flatten_list";
import { DynamicInputTypesMutator } from "../mutators/dynamic_input_types";
import { ListAnyAllMutator } from "../mutators/list_any_all";
import { ListSelectMutator } from "../mutators/list_select";
import { ASTNodeKind, createASTNode } from "@/query/builder/ast";

export const ListArithmeticBlock = createBlock({
    id: Blocks.Names.LIST.MATH,
    lines: [
        {
            text: "%1 %{BKY_OF} %2",
            args: [
                {
                    type: "field_dropdown",
                    name: "OP",
                    options: [
                        ["%{BKY_SUM}", "SUM"],
                        ["%{BKY_AVERAGE}", "AVERAGE"],
                        ["%{BKY_STD_DEV}", "STD"],
                        ["%{BKY_MIN}", "MIN"],
                        ["%{BKY_Q1}", "Q1"],
                        ["%{BKY_MEDIAN}", "MEDIAN"],
                        ["%{BKY_Q3}", "Q3"],
                        ["%{BKY_MAX}", "MAX"],
                        ["%{BKY_MODE}", "MODE"],
                        ["%{BKY_VARIANCE}", "VARIANCE"],
                        ["%{BKY_RANGE}", "RANGE"],
                        ["%{BKY_IQR}", "IQR"],
                        ["%{BKY_COUNT}", "COUNT"],
                    ],
                },
                {
                    type: "input_value",
                    name: "LIST",
                    check: t.list(t.number)
                },
            ]
        }
    ] as const,
    output: t.number,
    helpUrl: "#list-operations",
    style: "list_blocks",
    inputsInline: true,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "unary_list_operation",
            type: t.number,
            args: {
                operator: scope.buildASTForField("OP"),
                list: scope.buildASTForInput("LIST"),
            },
        })
    }
})

export const ListLengthBlock = createBlock({
    id: Blocks.Names.LIST.LENGTH,
    lines: [
        {
            text: "%{BKY_LENGTH} %{BKY_OF} %1",
            args: [
                {
                    type: "input_value",
                    name: "LIST",
                    check: t.list(t.nullable(t.wildcard))
                },
            ]
        }
    ] as const,
    output: t.number,
    helpUrl: "#list-length",
    style: "list_blocks",
    inputsInline: true,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "list_length",
            type: t.number,
            args: {
                list: scope.buildASTForInput("LIST"),
            }
        })
    }
})

export const ListContainsBlock = createBlock({
    id: Blocks.Names.LIST.CONTAINS,
    lines: [
        {
            text: "%1 %{BKY_CONTAINS} %2",
            args: [
                {
                    type: "input_value",
                    name: "LIST",
                    check: t.list(t.nullable(t.wildcard))
                },
                {
                    type: "input_value",
                    name: "VALUE",
                    check: t.nullable(t.wildcard)
                },
            ]
        }
    ] as const,
    style: "list_blocks",
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
    helpUrl: "#list-contains",
    connectionType: ConnectionType.BOOLEAN,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "list_contains",
            type: t.boolean,
            args: {
                list: scope.buildASTForInput("LIST"),
                value: scope.buildASTForInput("VALUE"),
            }
        })
    }
})

export const ListAnyAllBlock = createBlock({
    id: Blocks.Names.LIST.ANY_ALL,
    lines: [
        {
            text: "%{BKY_TRUE} %{BKY_FOR} %1 %2 %{BKY_OF} %3",
            args: [
                {
                    type: "field_dropdown",
                    name: "OP",
                    options: [
                        ["%{BKY_ANY}", "ANY"],
                        ["%{BKY_ALL}", "ALL"],
                    ],
                },
                {
                    type: "field_local_variable",
                    name: "VALUE",
                    text: "%{BKY_VALUE}",
                    shapeType: t.wildcard
                },
                {
                    type: "input_value",
                    name: "LIST",
                    check: t.list(t.nullable(t.wildcard))
                },
            ]
        },
        {
            text: "%1",
            args: [
                {
                    type: "input_statement",
                    name: "QUERY",
                    check: ConnectionType.BOOLEAN
                },
            ]
        }
    ] as const,
    style: "list_blocks",
    inputsInline: true,
    connectionType: ConnectionType.BOOLEAN,
    helpUrl: "#list-any-all",
    mutator: ListAnyAllMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "list_any_all",
            type: t.boolean,
            args: {
                operation: scope.buildASTForField("OP"),
                value: scope.buildASTForField("VALUE"),
                list: scope.buildASTForInput("LIST"),
                query: scope.buildASTForStatementInput("QUERY"),
            }
        })
    }
})

export const ListImmediateBlock = createBlock({
    id: Blocks.Names.LIST.IMMEDIATE,
    lines: [] as const,
    output: t.list(t.wildcard),
    style: "comparisons_blocks",
    inputsInline: true,
    extensions: [ParentColorExtension],
    mutator: ListSelectMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Primitive, scope.definition, {
            value: scope.block.getList(),
            type: scope.block.variableType
        })
    }
})

export const ListFlattenBlock = createBlock({
    id: Blocks.Names.LIST.FLATTEN,
    lines: [
        {
            text: "%{BKY_FLATTEN} %1",
            args: [
                {
                    type: "input_value",
                    name: "LIST",
                    check: t.list(t.list(t.nullable(t.wildcard)))
                }
            ]
        }
    ] as const,
    output: t.list(t.nullable(t.wildcard)),
    style: "list_blocks",
    helpUrl: "#list-flatten",
    extensions: [FlattenListExtension],
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "flatten_list",
            type: scope.block.variableType,
            args: {
                list: scope.buildASTForInput("LIST"),
            }
        })
    }
})

export const ListEqualsBlock = createBlock({
    id: Blocks.Names.LIST.EQUALS,
    lines: [
        {
            text: "%1 %2 %3",
            args: [
                {
                    type: "input_value",
                    name: "LIST1",
                    check: t.list(t.nullable(t.wildcard))
                },
                {
                    type: "field_dropdown",
                    name: "OP",
                    options: [
                        ["%{BKY_EQUALS}", "EQUALS"],
                        ["%{BKY_CONTAINS_SEQUENCE}", "CONTAINS"],
                        ["%{BKY_STARTS_WITH}", "STARTS_WITH"],
                        ["%{BKY_ENDS_WITH}", "ENDS_WITH"],
                        ["%{BKY_CONTAINS_ALL_ITEMS_OF}", "CONTAINS_ALL_ITEMS_OF"],
                    ],
                },
                {
                    type: "input_value",
                    name: "LIST2",
                    check: t.list(t.nullable(t.wildcard))
                },
            ]
        }
    ] as const,
    style: "list_blocks",
    inputsInline: true,
    mutator: DynamicInputTypesMutator,
    helpUrl: "#list-equals",
    connectionType: ConnectionType.BOOLEAN,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "list_equals",
            type: t.boolean,
            args: {
                a: scope.buildASTForInput("LIST1"),
                b: scope.buildASTForInput("LIST2"),
                operator: scope.buildASTForField("OP"),
            }
        })
    }
})
