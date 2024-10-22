import * as Blockly from 'blockly/core';
import { isTargetNodeCapacityAvailable } from './blockly_patches';

export class Block extends Blockly.Block {
    public override isDuplicatable(): boolean {
        if (isTargetNodeCapacityAvailable(this.workspace, this) === false) return false
        return super.isDuplicatable()
    }
}