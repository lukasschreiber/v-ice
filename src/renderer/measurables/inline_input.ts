import * as Blockly from "blockly/core";
import { ConstantProvider } from "../constants";

export class InlineInput extends Blockly.blockRendering.InlineInput {
    constructor(constants: ConstantProvider, input: Blockly.Input) {
        super(constants, input);

        // if the input has a widget we adjust the width to account for potential size differences
        if(Blockly.WidgetDiv.isVisible()) {
            const div = Blockly.WidgetDiv.getDiv();

            if (div && div.dataset.block === input.getSourceBlock().id && div.dataset.input === input.name) {
                const widgetWidth = div.getBoundingClientRect().width || 0;
                const inputWidth = div.querySelector("input")?.getBoundingClientRect().width || 0;

                const xOffset = parseFloat(div.dataset.xOffset || "0");

                this.width += widgetWidth - inputWidth + constants.SMALL_PADDING - xOffset;
            }
        }

        if(!input.connection?.isConnected()) {
            this.width = Math.max(this.width, (this.constants_ as ConstantProvider).EMPTY_INLINE_INPUT_MIN_WIDTH);
        }
    }
}
