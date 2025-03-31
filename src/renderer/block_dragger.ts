import { Blocks } from "@/blocks";
import { FieldLocalVariable } from "@/blocks/fields/field_local_variable";
import { getFieldFromEvent } from "@/events/utils";
import * as Blockly from "blockly/core";

export class BlockDragger extends Blockly.dragging.Dragger {
    override onDrag(e: PointerEvent, delta: Blockly.utils.Coordinate): void {
        super.onDrag(e, delta);

        const target = this.draggable;
        const targetField = getFieldFromEvent(e, this.workspace);
        if (target instanceof Blockly.BlockSvg) {
            if (targetField && targetField instanceof FieldLocalVariable && Blocks.Types.isScopedBlock(target) && targetField.getSourceBlock()?.id === target.scope) {
                this.wouldDeleteDraggable = () => true;
            }
            target.render()
        }
    }
}