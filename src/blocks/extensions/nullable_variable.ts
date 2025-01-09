import * as Blockly from "blockly/core"
import { FieldTypeLabel } from "../fields/field_type_label"
import types from "@/data/types"
import { BlockExtension } from "@/blocks/block_extensions"

export class NullableVariableExtension extends BlockExtension<Blockly.Block> {
    constructor() {
        super("nullable_variable")
    }

    extension(this: Blockly.Block) {
        const typeLabelField = this.getField("TYPE") as FieldTypeLabel

        this.setOnChange((e) => {
            if ((e.toJson() as Blockly.Events.BlockBaseJson).blockId !== this.id) return
            const type = typeLabelField.getType()
            if (type && types.utils.isNullable(type)) {
                this.setStyle("variable_blocks_nullable")
            }
        })

    }
}