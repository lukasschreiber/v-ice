
import * as Blockly from "blockly/core";
import { BlockDragger } from "./block_dragger";

export class FullScreenBlockDragger extends BlockDragger {
    constructor(draggable: Blockly.IDraggable, workspace: Blockly.WorkspaceSvg) {
        super(draggable, workspace);
        workspace.getInjectionDiv().classList.add("full-screen-dragger");
    }

    override onDrag(e: PointerEvent, delta: Blockly.utils.Coordinate): void {
        const bounds = this.workspace.getInjectionDiv().getBoundingClientRect();
        super.onDrag(e, delta.translate(bounds.left, bounds.top));
    }

    protected override wouldDeleteDraggable(e: PointerEvent, _rootDraggable: Blockly.IDraggable & Blockly.IDeletable): boolean {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        if (!elements.find(element => element.id === "canvas")) {
            return true;
        }
        if (elements.find(element => element.classList.contains("blocklyFlyout") || (element as HTMLElement).dataset.deletezone === "true") || elements.find(element => element.classList.contains("blocklyToolboxDiv"))) {
            return true;
        }
        return false // super.wouldDeleteDraggable(e, rootDraggable);
    }
}