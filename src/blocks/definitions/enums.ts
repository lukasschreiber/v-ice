import { Blocks } from "@/blocks";
import { registerBlocks } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";
import { ParentColorExtension } from "../extensions/parent_color";
import { EnumSelectMutator } from "../mutators/enum_select";

export default registerBlocks([
    {
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
        ],
        output: t.enum(t.wildcard),
        color: Colors.categories.comparisons,
        extensions: [ParentColorExtension],
        mutator: EnumSelectMutator
    },
] as const)