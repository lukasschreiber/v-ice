import { Blocks } from "@/blocks";
import { registerBlocksFromJsonArray } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";

export default registerBlocksFromJsonArray([
    {
        id: Blocks.Names.STRINGS.IMMEDIATE,
        message0: "%1",
        args0: [
           {
                type: "field_textinput",
                name: "VALUE",
                text: ""
           }
        ],
        output: t.string,
        colour: Colors.categories.comparisons,
        extensions: ["parent_color"],
    },
] as const)