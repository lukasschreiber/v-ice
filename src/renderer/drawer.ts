import * as Blockly from "blockly/core";
import { Shape } from "blockly/core/renderers/common/constants";
import { PathObject } from "./path_object";
import types from "@/data/types";
import { IconFactory } from "@/blocks/icon_factory";
import { getColor, getColorsForBlockStyle } from "@/themes/colors";

// FIXME: move to another file
export function isDynamicShape(shape: Shape): shape is Blockly.blockRendering.DynamicShape {
    return (shape as Blockly.blockRendering.DynamicShape).isDynamic;
}


export class Drawer extends Blockly.zelos.Drawer {
    constructor(block: Blockly.BlockSvg, info: Blockly.zelos.RenderInfo) {
        super(block, info);
    }

    protected override layoutField_(fieldInfo: Blockly.blockRendering.Icon | Blockly.blockRendering.Field): void {
        if (Blockly.blockRendering.Types.isField(fieldInfo)) {
            const svgRoot = (fieldInfo as Blockly.blockRendering.Field).field.getSvgRoot()
            if (svgRoot) {
                const svgText = svgRoot.querySelector(".blocklyText") as SVGTextElement | undefined;
                if (svgText && (!svgRoot.classList.contains("blocklyEditableInputText"))) {
                    const style = this.block_.getStyleName();
                    svgText.style.fill = getColorsForBlockStyle(style).text
                } else if (svgText && svgRoot.classList.contains("blocklyEditableInputText")) {
                    svgText.style.fill = getColor("workspace-inputs-text")
                }
            }
        }

        if ((fieldInfo as Blockly.blockRendering.Field).field.getSvgRoot()) {
            super.layoutField_(fieldInfo)
        }
    }

    override drawInlineInput_(input: Blockly.blockRendering.InlineInput) {
        this.positionInlineInputConnection_(input);

        const inputName = input.input.name;
        this.block_.getSvgRoot().querySelector(`path.blocklyTypeIcon[data-input="${inputName}-${this.block_.id}"]`)?.remove()

        const pathObject = this.block_.pathObject as PathObject;

        if (input.connectedBlock || this.info_.isInsertionMarker || input.input.getShadowDom() !== null) {
            return;
        }

        const yPos = input.centerline - input.height / 2;
        const connectionRight = input.xPos + input.connectionWidth;

        const path = Blockly.utils.svgPaths.moveTo(connectionRight, yPos) + this.getInlineInputPath_(input);

        pathObject.setOutlinePath(inputName, path);

        const typeString = input.input.connection?.getCheck()?.[0]
        if (typeString) {
            const icon = IconFactory.createIconForType(types.utils.fromString(typeString), this.block_.style.colourPrimary, this.block_.style.colourTertiary)
            if (icon) {
                if (!this.block_.isInFlyout) {
                    this.block_.getSvgRoot().querySelectorAll(`.blocklyTypeIcon[data-input="${inputName}-${this.block_.id}"]`).forEach(e => e.remove())
                }
                icon.setAttribute("data-input", inputName + "-" + this.block_.id)
                this.block_.getSvgRoot().appendChild(icon)
                
                icon.dataset.clickable = "true"
                icon.dataset.type = typeString

                const iconBBox = icon.getBBox()
                icon.setAttribute("transform", `translate(${input.xPos + input.width / 2 - iconBBox.width / 2}, ${yPos + input.height / 2 - iconBBox.height / 2})`)
            }
        }
    }

    private getInlineInputPath_(input: Blockly.blockRendering.InlineInput) {
        const width = input.width - input.connectionWidth * 2;
        const height = input.height;

        return (
            Blockly.utils.svgPaths.lineOnAxis('h', width) +
            (input.shape as Blockly.blockRendering.DynamicShape).pathRightDown(height) +
            Blockly.utils.svgPaths.lineOnAxis('h', -width) +
            (input.shape as Blockly.blockRendering.DynamicShape).pathUp(height) +
            'z'
        );
    }
}
