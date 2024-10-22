import { Blocks } from "@/blocks";
import { registerBlocksFromJsonArray } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";

export default registerBlocksFromJsonArray([
    {
        id: Blocks.Names.ENUM.SELECT,
        message0: "%1",
        args0: [
            {
                type: 'field_autocomplete_text',
                name: 'ENUM',
            },
        ],
        output: t.enum(t.wildcard),
        colour: Colors.categories.comparisons,
        extensions: ["parent_color"],
        mutator: "enum_select_mutator"
    },
] as const)