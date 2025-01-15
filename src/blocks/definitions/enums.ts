import { Blocks } from "@/blocks";
import { createBlock } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";
import { ParentColorExtension } from "../extensions/parent_color";
import { EnumSelectMutator } from "../mutators/enum_select";

export const EnumSelectBlock = createBlock({
    id: Blocks.Names.ENUM.SELECT,
    lines: [
        {
            text: "%1",
            args: [
                {
                    type: "field_autocomplete_text",
                    name: "ENUM",
                }
            ]
        }
    ] as const,
    output: t.enum(t.wildcard),
    color: Colors.categories.comparisons,
    extensions: [ParentColorExtension],
    mutator: EnumSelectMutator,
    code: (scope) => {
        return {
            operation: "enum",
            args: {
                name: scope.buildASTForField("ENUM"),
            }
        }
    }
})