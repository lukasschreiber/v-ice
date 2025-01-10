import { Blocks } from "@/blocks";
import { createBlockDefinition, registerBlocks } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";
import { ParentColorExtension } from "../extensions/parent_color";
import { HierarchySelectMutator } from "../mutators/hierarchy_select";

export default registerBlocks([
    createBlockDefinition({
        id: Blocks.Names.HIERARCHY.SELECT,
        lines: [
            {
                text: "%1",
                args: [
                    {
                        type: "field_hierarchy",
                        name: "HIERARCHY",
                    }
                ]
            }
        ],
        output: t.hierarchy(t.wildcard),
        color: Colors.categories.comparisons,
        extensions: [ParentColorExtension],
        mutator: HierarchySelectMutator
    })
] as const)