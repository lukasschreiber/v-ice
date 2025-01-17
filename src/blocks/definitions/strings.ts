import { Blocks } from "@/blocks";
import { createBlock } from "@/blocks/block_definitions";
import t from "@/data/types"
import { ParentColorExtension } from "../extensions/parent_color";

export const StringBlock = createBlock({
    id: Blocks.Names.STRINGS.IMMEDIATE,
    lines: [
        {
            text: "%1",
            args: [
                {
                    type: "field_textinput",
                    name: "VALUE",
                    text: ""
                }
            ]
        }
    ],
    output: t.string,
    style: "comparisons_blocks",
    extensions: [ParentColorExtension],
    code: (scope) => {
        return scope.buildASTForField("VALUE")
    }
})
