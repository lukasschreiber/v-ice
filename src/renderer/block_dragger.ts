import { Blocks } from "@/blocks";
import { FieldLocalVariable } from "@/blocks/fields/field_local_variable";
import { getFieldFromEvent } from "@/events/utils";
import { closeSearchForm } from "@/store/blockly/blockly_slice";
import { store } from "@/store/store";
import * as Blockly from "blockly/core";
import { Renderer } from "./renderer";

export class BlockDragger extends Blockly.dragging.Dragger {

    override onDragStart(e: PointerEvent): void {
        store.dispatch(closeSearchForm());
        super.onDragStart(e);
    }

    override onDrag(e: PointerEvent, delta: Blockly.utils.Coordinate): void {
        super.onDrag(e, delta);

        const target = this.draggable;
        const targetField = getFieldFromEvent(e, this.workspace);
        if (target instanceof Blockly.BlockSvg) {
            if (targetField && targetField instanceof FieldLocalVariable && Blocks.Types.isScopedBlock(target) && targetField.getSourceBlock()?.id === target.scope) {
                this.wouldDeleteDraggable = () => true;
            }
            const renderer = target.workspace.getRenderer() as Renderer;
            renderer.render(target, true);
        }
    }
}