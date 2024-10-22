import { Blocks } from "@/blocks";
import { ConnectionType, registerBlocksFromJsonArray } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";

export default registerBlocksFromJsonArray([
    {
        id: Blocks.Names.LOGIC.OR,
        message0: "%{BKY_EITHER}",
        message1: "%1",
        message2: "%{BKY_OR}",
        message3: "%1",
        args1: [
            {
                type: "input_statement",
                name: "OR_STATEMENT_0",
                check: ConnectionType.BOOLEAN,
            },
        ],
        args3: [
            {
                type: "input_statement",
                name: "OR_STATEMENT_1",
                check: ConnectionType.BOOLEAN,
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        style: "logic_blocks",
        helpUrl: "#logic-or",
        mutator: "either_or_mutator",
    },
    {
        id: Blocks.Names.LOGIC.NOT,
        message0: "%{BKY_NOT}",
        message1: "%1",
        args1: [
            {
                type: "input_statement",
                name: "STATEMENTS",
                check: ConnectionType.BOOLEAN,
            },
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        style: "logic_blocks",
        helpUrl: "#logic-not",
    },
    {
        id: Blocks.Names.LOGIC.BOOLEAN,
        message0: "%1",
        args0: [
            {
                type: "field_dropdown",
                name: "BOOL",
                options: [
                    ["%{BKY_TRUE}", "TRUE"],
                    ["%{BKY_FALSE}", "FALSE"],
                ],
            },
        ],
        output: t.boolean,
        extensions: ["parent_color"],
        colour: Colors.categories.comparisons,

    }
] as const)