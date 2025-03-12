import * as Blockly from "blockly/core";
import { TypeChecker } from "./data/type_checker";
import t from "./data/types";
import { Blocks } from "./blocks";
import { getAllBlocksInGraph } from "./utils/nodes";

export class TypedConnectionChecker extends Blockly.ConnectionChecker {
    protected getBlocksInScope(block: Blockly.Block): Set<string> {
        const blocks = new Set(block.getDescendants(false).map(b => b.id));
        const nextBlock = block.getNextBlock();
        if (nextBlock) {
            nextBlock.getDescendants(false).forEach(b => blocks.delete(b.id));
        }
        return blocks;
    }

    override doTypeChecks(a: Blockly.Connection, b: Blockly.Connection): boolean {
        const checkOne = a.getCheck()?.[0];
        const checkTwo = b.getCheck()?.[0];

        const aBlock = a.getSourceBlock();
        const bBlock = b.getSourceBlock();

        // BEGIN: Local Variable Scope Check
        if (Blocks.Types.isScopedBlock(aBlock)) {
            const scope = aBlock.workspace.getBlockById(aBlock.scope);
            const isInGraph = getAllBlocksInGraph(aBlock.workspace).includes(bBlock);
            if (scope && isInGraph && !this.getBlocksInScope(scope).has(bBlock.id)) return false;
        }

        if (Blocks.Types.isScopedBlock(bBlock)) {
            const scope = bBlock.workspace.getBlockById(bBlock.scope);
            const isInGraph = getAllBlocksInGraph(bBlock.workspace).includes(aBlock);
            if (scope && isInGraph && !this.getBlocksInScope(scope).has(aBlock.id)) return false;
        }
        // END: Local Variable Scope Check
        
        // BEGIN: Connection Check for previous/next statement  
        if ((a.type === Blockly.PREVIOUS_STATEMENT && b.type === Blockly.NEXT_STATEMENT) || (a.type === Blockly.NEXT_STATEMENT && b.type === Blockly.PREVIOUS_STATEMENT)) {
            return checkOne === checkTwo;
        }

        if(!checkOne || !checkTwo) return true;
        // END: Connection Check for previous/next statement

        // BEGIN: Input/Output Check
        if (a.type === Blockly.INPUT_VALUE && b.type === Blockly.OUTPUT_VALUE) {
            return TypeChecker.checkTypeCompatibility(t.utils.fromString(checkOne), t.utils.fromString(checkTwo));
        } else if (a.type === Blockly.OUTPUT_VALUE && b.type === Blockly.INPUT_VALUE) {
            return TypeChecker.checkTypeCompatibility(t.utils.fromString(checkTwo), t.utils.fromString(checkOne));
        }
        // END: Input/Output Check

        console.warn("Checking the connection in both directions, this should not happen.")
        // if the connection is not a value connection, we check both ways
        return TypeChecker.checkTypeCompatibility(t.utils.fromString(checkOne), t.utils.fromString(checkTwo)) && TypeChecker.checkTypeCompatibility(t.utils.fromString(checkTwo), t.utils.fromString(checkOne));
    }
}

// in theory, this should work over the plugin option but that only affects the workspace, not the flyout
// so we have to do it this way
Blockly.registry.unregister(Blockly.registry.Type.CONNECTION_CHECKER, Blockly.registry.DEFAULT);
Blockly.registry.register(Blockly.registry.Type.CONNECTION_CHECKER, Blockly.registry.DEFAULT, TypedConnectionChecker);