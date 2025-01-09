import { Blocks } from "@/blocks";
import { registerBlocks } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";
import { ParentColorExtension } from "../extensions/parent_color";

export default registerBlocks([
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
        color: Colors.categories.comparisons,
        extensions: [ParentColorExtension],
        mutator: "enum_select_mutator"
    },
] as const)