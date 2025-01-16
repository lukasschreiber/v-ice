import { Blocks } from "@/blocks";
import { createBlock } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";
import { ParentColorExtension } from "../extensions/parent_color";
import { HierarchySelectMutator } from "../mutators/hierarchy_select";

export const HierarchySelectBlock = createBlock({
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
    ] as const,
    output: t.hierarchy(t.wildcard),
    color: Colors.categories.comparisons,
    extensions: [ParentColorExtension],
    mutator: HierarchySelectMutator,
    code: (scope) => {
        return scope.buildASTForField("HIERARCHY", (value) => value, scope.block.variableType)
    }
})
