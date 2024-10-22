import * as Blockly from "blockly/core"
import { getConnectionFromEvent, getFieldFromEvent } from "@/events/utils"
import * as ContextMenu from "@/contextmenu_items";
import { FieldEdgeConnection } from "./blocks/fields/field_edge_connection";
import { Renderer } from "./renderer/renderer";
import { Blocks } from "./blocks";
import { FieldLocalVariable } from "./blocks/fields/field_local_variable";

export class Gesture extends Blockly.Gesture {
    private startEdgeConnection_: FieldEdgeConnection | null = null;

    isDraggingEdge(): boolean {
        return this.startEdgeConnection_ !== null
    }

    handleWsStart(e: PointerEvent, ws: Blockly.WorkspaceSvg): void {
        if (this.isDraggingEdge()) return
        super.handleWsStart(e, ws)
    }

    handleBlockStart(e: PointerEvent, block: Blockly.BlockSvg): void {
        if (this.isDraggingEdge()) return
        if (!block.workspace.isFlyout) {
            const targetField = getFieldFromEvent(e, block.workspace, block);
            if (targetField && targetField instanceof FieldLocalVariable && !this.isDragging() && !this.isMultiTouch()){
                // create a new block and start dragging it at the touch position
                const newBlock = targetField.createBlock(e)
                if (newBlock) super.handleBlockStart(e, newBlock)
                return

            }
        }

        super.handleBlockStart(e, block)
    }

    setStartField<T>(field: Blockly.Field<T>): void {
        if (this.isDraggingEdge()) return
        super.setStartField(field)
    }

    override handleRightClick(e: PointerEvent): void {
        if (this.startWorkspace_) {
            const connection = getConnectionFromEvent(e, this.startWorkspace_)
            if (connection) {

                const menuOptions: Blockly.ContextMenuRegistry.ContextMenuOption[] = [];
                menuOptions.push(ContextMenu.deleteConnectionOption(connection))

                Blockly.ContextMenu.show(e, menuOptions, this.startWorkspace_.RTL)

                // if we handle the event we want to stop the default gesture behavior
                // see https://github.com/google/blockly/blob/e2df0fc2885cb994886c0af863035f50bb849948/core/gesture.ts#L821
                e.preventDefault()
                e.stopPropagation()

                this.dispose()
                return
            }
        }
        super.handleRightClick(e)
    }

    override handleUp(e: PointerEvent): void {
        const targetField = getFieldFromEvent(e, this.startWorkspace_!);

        if (this.isDraggingEdge()) {
            // if we are hovering over a field we want to connect to it
            const targetBlock = targetField?.getSourceBlock()
            const sourceBlock = this.startEdgeConnection_?.getSourceBlock()
            if (targetField && targetField instanceof FieldEdgeConnection && Blocks.Types.isNodeBlock(targetBlock) && Blocks.Types.isNodeBlock(sourceBlock)) {
                targetBlock.connectNode(sourceBlock, targetField.name!, this.startEdgeConnection_!.name!)
            }

            this.startEdgeConnection_ = null
            this.dispose()
            return
        }

        if (targetField && targetField instanceof FieldEdgeConnection && !this.isDragging() && !this.isMultiTouch() && !this.startWorkspace_?.isFlyout) {
            this.startEdgeConnection_ = targetField
            return
        }

        super.handleUp(e)
    }

    override handleMove(e: PointerEvent): void {
        const sourceBlock = this.startEdgeConnection_?.getSourceBlock()
        if (this.isDraggingEdge() && this.startWorkspace_ && Blocks.Types.isNodeBlock(sourceBlock) && !this.isDragging()) {
            const renderer = this.startWorkspace_.getRenderer() as Renderer
            renderer.makeEdgeDrawer({ sourceBlock: sourceBlock, sourceField: this.startEdgeConnection_! }).drawMarker(e)
            return
        }

        super.handleMove(e)
    }

    dispose(): void {
        this.startEdgeConnection_ = null
        if (this.startWorkspace_) {
            (this.startWorkspace_.getRenderer() as Renderer).disposeEdgeDrawer()
        }
        super.dispose()
    }
}