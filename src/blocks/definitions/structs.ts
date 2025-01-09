import { Blocks } from "@/blocks";
import { registerBlocks } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";
import { ParentColorExtension } from "../extensions/parent_color";

export default registerBlocks([
    {
        id: Blocks.Names.STRUCTS.IMMEDIATE,
        message0: "",
        output: t.struct(t.wildcard),
        color: Colors.categories.comparisons,
        inputsInline: true,
        extensions: [ParentColorExtension],
        mutator: "struct_select_mutator"
    },
    {
        id: Blocks.Names.STRUCTS.GET_PROPERTY,
        message0: "%1 %{BKY_OF} %2",
        args0: [
            {
                type: 'field_dynamic_dropdown',
                name: 'PROPERTY',
                options: [["%{BKY_ATTRIBUTE}", "NAME"]]
            },
            {
                type: 'input_value',
                name: 'STRUCT',
                check: t.union(t.struct(t.wildcard), t.list(t.struct(t.wildcard)))
            }
        ],
        output: t.wildcard,
        style: "list_blocks",
        helpUrl: "#struct-get",
        mutator: "struct_property_select_mutator"
    }
] as const)