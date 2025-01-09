import { Blocks } from "@/blocks";
import { registerBlocks } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";
import { ParentColorExtension } from "../extensions/parent_color";

export default registerBlocks([
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
        color: Colors.categories.comparisons,
        extensions: [ParentColorExtension],
        mutator: "hierarchy_select_mutator"
    }
] as const)