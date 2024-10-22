import * as BlockNames from "@/blocks/block_names"
import * as Blockly from "blockly/core"
import { NodeBlock } from "./blocks/extensions/node"
import { ScopedBlock } from "./blocks/extensions/scoped"
import { DynamicInputBlock } from "./blocks/mutators/dynamic_input_types"

const Types = {
    isNodeBlock<T extends Blockly.BlockSvg | Blockly.Block>(block: T | null | undefined): block is T & NodeBlock {
        if (block === null || block === undefined) return false
        return Object.prototype.hasOwnProperty.call(block, "isNode_")
    },
    isVariableGetterBlock<T extends Blockly.BlockSvg | Blockly.Block>(block: T | null | undefined): boolean {
        if (block === null || block === undefined) return false
        return block.type === BlockNames.VARIABLE.GET
    },
    isScopedBlock<T extends Blockly.BlockSvg | Blockly.Block>(block: T | null | undefined): block is T & ScopedBlock {
        if (block === null || block === undefined) return false
        return Object.prototype.hasOwnProperty.call(block, "isScoped_")
    },
    isDynamicInputBlock<T extends Blockly.BlockSvg | Blockly.Block>(block: T | null | undefined): block is T & DynamicInputBlock {
        if (block === null || block === undefined) return false
        return Object.prototype.hasOwnProperty.call(block, "inputTypes")
    }
}

export const Blocks = {
    Names: BlockNames,
    Types: Types
}