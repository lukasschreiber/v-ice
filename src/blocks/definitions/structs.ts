import { Blocks } from "@/blocks";
import { createBlock } from "@/blocks/block_definitions";
import t from "@/data/types"
import { Colors } from "@/themes/colors";
import { ParentColorExtension } from "../extensions/parent_color";
import { StructPropertySelectMutator } from "../mutators/struct_property_select";
import { StructSelectMutator } from "../mutators/struct_select";

export const StructBlock = createBlock({
    id: Blocks.Names.STRUCTS.IMMEDIATE,
    lines: [] as const,
    output: t.struct(t.wildcard),
    color: Colors.categories.comparisons,
    inputsInline: true,
    extensions: [ParentColorExtension],
    mutator: StructSelectMutator
})

export const ProperySelectBlock = createBlock({
    id: Blocks.Names.STRUCTS.GET_PROPERTY,
    lines: [
        {
            text: "%1 %{BKY_OF} %2",
            args: [
                {
                    type: "field_dynamic_dropdown",
                    name: "PROPERTY",
                    options: [["%{BKY_ATTRIBUTE}", "NAME"]]
                },
                {
                    type: "input_value",
                    name: "STRUCT",
                    check: t.union(t.struct(t.wildcard), t.list(t.struct(t.wildcard)))
                }
            ]
        }
    ] as const,
    output: t.wildcard,
    style: "list_blocks",
    helpUrl: "#struct-get",
    mutator: StructPropertySelectMutator
})
