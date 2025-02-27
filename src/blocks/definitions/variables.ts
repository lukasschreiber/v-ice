import { Blocks } from "@/blocks";
import { ConnectionType, createBlock } from "@/blocks/block_definitions";
import t from "@/data/types"
import { ScopedExtension } from "../extensions/scoped";
import { LocalVariableMutator } from "../mutators/local_variable";
import { VariableSelectMutator } from "../mutators/variable_select";
import { ColumnSelectMutator } from "../mutators/column_select";
import { FieldVariable } from "../fields/field_variable";
import { ASTNodeKind, createASTNode } from "@/query/builder/ast";
import { FieldTypeLabel } from "../fields/field_type_label";
import { HasVariableMutator } from "../mutators/has_variable";

export const ColumnSelectBlock = createBlock({
    id: Blocks.Names.VARIABLE.GET_COLUMN,
    lines: [
        {
            text: "%{BKY_COLUMN} %1 %2",
            args: [
                {
                    type: 'field_dynamic_dropdown',
                    name: 'COLUMN',
                    options: [
                        ["", ""],
                    ],
                },
                {
                    type: 'field_type_label',
                    name: 'TYPE',
                    iconType: t.list(t.wildcard)
                }
            ]
        },
    ],
    output: t.list(t.wildcard),
    helpUrl: "#column-variable",
    style: "variable_blocks",
    mutator: ColumnSelectMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "get_column",
            type: scope.getField<FieldTypeLabel>("TYPE").getType() ?? null,
            args: {
                name: createASTNode(ASTNodeKind.Primitive, null, { value: scope.getFieldValue("COLUMN"), type: t.string }),
            }
        })
    }
})

export const VariableBlock = createBlock({
    id: Blocks.Names.VARIABLE.GET,
    lines: [
        {
            text: "%1 %2",
            args: [
                {
                    type: 'field_variable',
                    name: 'VAR',
                    variable: '%{BKY_VARIABLES_DEFAULT_NAME}',
                },
                {
                    type: 'field_type_label',
                    name: 'TYPE',
                    iconType: t.number
                }
            ]
        }
    ] as const,
    output: t.wildcard,
    style: "variable_blocks",
    helpUrl: "#variables",
    mutator: VariableSelectMutator,
    code: (scope) => {
        const variable = scope.getField<FieldVariable>("VAR").getVariable()
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "get_variable",
            type: variable?.type ?? null,
            args: {
                name: createASTNode(ASTNodeKind.Primitive, null, {value: variable?.name ?? "", type: t.string}),
            }
        })
    }
})

export const LocalVariableBlock = createBlock({
    id: Blocks.Names.VARIABLE.LOCAL_GET,
    lines: [
        {
            text: "%1 %2",
            args: [
                {
                    type: 'field_label_serializable',
                    name: 'LABEL',
                    text: "value",
                },
                {
                    type: 'field_type_label',
                    name: 'TYPE',
                    iconType: t.number
                }
            ]
        }
    ] as const,
    output: t.wildcard,
    style: "variable_blocks",
    extensions: [ScopedExtension],
    mutator: LocalVariableMutator,
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "get_local_variable",
            type: scope.getField<FieldTypeLabel>("TYPE").getType() ?? null,
            args: {
                name: createASTNode(ASTNodeKind.Primitive, null, { value: scope.getFieldValue("LABEL"), type: t.string }),
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
