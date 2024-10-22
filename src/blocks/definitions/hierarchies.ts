import { Blocks } from "@/blocks";
import { registerBlocksFromJsonArray } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";

export default registerBlocksFromJsonArray([
    {
        id: Blocks.Names.HIERARCHY.SELECT,
        message0: "%1",
        args0: [
            {
                type: 'field_hierarchy',
                name: 'HIERARCHY',
            },
        ],
        output: t.hierarchy(t.wildcard),
        colour: Colors.categories.comparisons,
        extensions: ["parent_color"],
        mutator: "hierarchy_select_mutator"
    }
] as const)