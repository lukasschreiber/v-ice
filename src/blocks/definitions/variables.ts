import { Blocks } from "@/blocks";
import { registerBlocksFromJsonArray } from "@/blocks/block_definitions";
import t from "@/data/types"

export default registerBlocksFromJsonArray([
    {
        id: Blocks.Names.VARIABLE.GET_COLUMN,
        message0: "%{BKY_COLUMN} %1 %2",
        args0: [
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
        ],
        output: t.list(t.wildcard),
        helpUrl: "#column-variable",
        style: "variable_blocks",
        mutator: "column_select_mutator"
    },
    {
        id: Blocks.Names.VARIABLE.GET,
        message0: "%1 %2",
        args0: [
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
        ],
        output: t.wildcard,
        style: "variable_blocks",
        helpUrl: "#variables",
        mutator: "variable_select_mutator"
    },
    {
        id: Blocks.Names.VARIABLE.LOCAL_GET,
        message0: "%1 %2",
        args0: [
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
        ],
        output: t.wildcard,
        style: "variable_blocks",
        extensions: ["scoped"],
        mutator: "local_variable_mutator"
    }
] as const)