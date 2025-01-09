import { Blocks } from "@/blocks";
import { ConnectionType, registerBlocks } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";
import { ParentColorExtension } from "../extensions/parent_color";

export default registerBlocks([
    {
        id: Blocks.Names.LOGIC.OR,
        lines: [
            {
                text: "%{BKY_EITHER}",
                args: []
            },
            {
                text: "%1",
                args: [
                    {
                        type: "input_statement",
                        name: "OR_STATEMENT_0",
                        check: ConnectionType.BOOLEAN,
                    },
                ]
            },
            {
                text: "%{BKY_OR}",
                args: []
            },
            {
                text: "%1",
                args: [
                    {
                        type: "input_statement",
                        name: "OR_STATEMENT_1",
                        check: ConnectionType.BOOLEAN,
                    },
                ]
            }
        ],
        connectionType: ConnectionType.BOOLEAN,
        style: "logic_blocks",
        helpUrl: "#logic-or",
        mutator: "either_or_mutator",
    },
    {
        id: Blocks.Names.LOGIC.NOT,
        lines: [
            {
                text: "%{BKY_NOT}",
                args: []
            },
            {
                text: "%1",
                args: [
                    {
                        type: "input_statement",
                        name: "STATEMENTS",
                        check: ConnectionType.BOOLEAN,
                    },
                ]
            }
        ],
        connectionType: ConnectionType.BOOLEAN,
        style: "logic_blocks",
        helpUrl: "#logic-not",
    },
    {
        id: Blocks.Names.LOGIC.BOOLEAN,
        lines: [
            {
                text: "%1",
                args: [
                    {
                        type: "field_dropdown",
                        name: "BOOL",
                        options: [
                            ["%{BKY_TRUE}", "TRUE"],
                            ["%{BKY_FALSE}", "FALSE"],
                        ],
                    },
                ]
            }
        ],
        output: t.boolean,
        extensions: [ParentColorExtension],
        color: Colors.categories.comparisons,
    }
] as const)