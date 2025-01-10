import { Blocks } from "@/blocks";
import { createBlockDefinition, registerBlocks } from "@/blocks/block_definitions";
import t from "@/data/types"
import { ScopedExtension } from "../extensions/scoped";
import { LocalVariableMutator } from "../mutators/local_variable";
import { VariableSelectMutator } from "../mutators/variable_select";
import { ColumnSelectMutator } from "../mutators/column_select";
import types from "@/data/types";

export default registerBlocks([
    createBlockDefinition({
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
        code: (block) => {
            return {
                name: block.getFieldValue("COLUMN"),
                args: {
                    COLUMN: types.boolean
                }
            }
        }
    }),
    createBlockDefinition({
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
        ],
        output: t.wildcard,
        style: "variable_blocks",
        helpUrl: "#variables",
        mutator: VariableSelectMutator
    }),
    createBlockDefinition({
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
        ],
        output: t.wildcard,
        style: "variable_blocks",
        extensions: [ScopedExtension],
        mutator: LocalVariableMutator
    })
] as const)