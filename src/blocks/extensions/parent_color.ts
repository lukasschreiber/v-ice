import * as Blockly from "blockly/core"

Blockly.Extensions.register(
    "parent_color",
    function (this: Blockly.Block) {
        this.workspace.addChangeListener(() => {
            // TODO: This is probably triggered too often
            const parentBlock = this.getParent()
            if (parentBlock && parentBlock.getStyleName() !== this.getStyleName()) {
                this.setStyle(parentBlock.getStyleName())
            }
        })
    }
)