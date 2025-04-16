
import * as Blockly from "blockly/core";
import { BlockDragger } from "./block_dragger";

export class FullScreenBlockDragger extends BlockDragger {
    constructor(draggable: Blockly.IDraggable, workspace: Blockly.WorkspaceSvg) {
        super(draggable, workspace);
        workspace.getInjectionDiv().classList.add("full-screen-dragger");
    }

    protected override pixelsToWorkspaceUnits(pixelCoord: Blockly.utils.Coordinate): Blockly.utils.Coordinate {
        const injectionDivBounds = this.workspace.getInjectionDiv().getBoundingClientRect();
        const result = new Blockly.utils.Coordinate(
            pixelCoord.x / this.workspace.scale + injectionDivBounds.left / this.workspace.scale,
            pixelCoord.y / this.workspace.scale + injectionDivBounds.top / this.workspace.scale,
        );

        return result;
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

    // We need to special case blocks for now so that we look at the root block
    // instead of the one actually being dragged in most cases.
    // This is private in Blockly, but we need it in onDragEnd
    private getRootOverride(draggable: Blockly.IDraggable): Blockly.IDraggable {
        return draggable instanceof Blockly.BlockSvg ? draggable.getRootBlock() : draggable;
    }

    onDragEnd(e: PointerEvent) {
        const origGroup = Blockly.Events.getGroup();
        const dragTarget = this.workspace.getDragTarget(e);
        const root = this.getRootOverride(this.draggable);

        if (dragTarget) {
            this.dragTarget?.onDrop(root);
        }

        if (this.shouldReturnToStart(e, root)) {
            this.draggable.revertDrag();
        }

        const wouldDelete = Blockly.isDeletable(root) && this.wouldDeleteDraggable(e, root);

        // TODO(#8148): use a generalized API instead of an instanceof check.
        if (wouldDelete && this.draggable instanceof Blockly.BlockSvg) {
            // we just need to move the block here...
            const rootBlock = this.draggable.getRootBlock();
            let position = rootBlock.getRelativeToSurfaceXY();
            if (this.workspace.getInjectionDiv().classList.contains('full-screen-dragger')) {         
                const injectionDivBounds = this.workspace.getInjectionDiv().getBoundingClientRect();
                position = new Blockly.utils.Coordinate(
                    position.x - injectionDivBounds.left / this.workspace.scale,
                    position.y - injectionDivBounds.top / this.workspace.scale,
                );
            }
            rootBlock.moveTo(position);
            Blockly.blockAnimations.disposeUiEffect(rootBlock);
        }

        this.draggable.endDrag(e);

        if (wouldDelete && Blockly.isDeletable(root)) {
            // We want to make sure the delete gets grouped with any possible
            // move event.
            const newGroup = Blockly.Events.getGroup();
            Blockly.Events.setGroup(origGroup);
            root.dispose();
            Blockly.Events.setGroup(newGroup);
        }
    }
}