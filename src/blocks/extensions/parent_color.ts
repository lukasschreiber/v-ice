import * as Blockly from "blockly/core"
import { BlockExtension } from "@/blocks/block_extensions"

export class ParentColorExtension extends BlockExtension<Blockly.Block> {
    constructor() {
        super("parent_color")
    }

    extension(this: Blockly.Block) {
        this.workspace.addChangeListener(() => {
            // TODO: This is probably triggered too often
            const parentBlock = this.getParent()
            if (parentBlock && parentBlock.getStyleName() !== this.getStyleName()) {
                this.setStyle(parentBlock.getStyleName())
            }
        })
    }
}