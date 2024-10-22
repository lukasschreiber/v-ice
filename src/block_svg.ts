import * as Blockly from 'blockly/core';
import { Blocks } from './blocks';
import { BlockDragStrategy } from './block_drag_strategy';

export class BlockSvg extends Blockly.BlockSvg {
    protected override doInit_(): void {
        super.doInit_();
        this.setDragStrategy(new BlockDragStrategy(this));
    }

    override checkAndDelete(): void {
        if (this.isInFlyout) {
            return;
        }
    
        Blockly.Events.setGroup(true);
    
        if (Blocks.Types.isNodeBlock(this)) {
            this.deleteEdges()
        }
    
        if (this.outputConnection) {
            this.dispose(false, true);
        } else {
            this.dispose(/* heal */ true, true);
        }
        Blockly.Events.setGroup(false);
    }

    override snapToGrid(): void {
        super.snapToGrid();
        if (Blocks.Types.isNodeBlock(this)) {
            this.render()
        }
    }
}