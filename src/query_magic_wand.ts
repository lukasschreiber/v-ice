import * as Blockly from 'blockly/core';
import { Blocks } from './blocks';
import { FieldLabelTargetNode } from './blocks/fields/field_label_target_node';
import { store } from './store/store';
import { NodeBlockSvg } from './blocks/extensions/node';

export class QueryMagicWand {
    public static canAutoComplete(workspace: Blockly.WorkspaceSvg): boolean {
        // autocomplete is possible if not all three node kinds are present or if any of the nodes has no edges
        // or if there is one of each kind of node and there is one top block that is not a node block
        const sources = workspace.getBlocksByType(Blocks.Names.NODE.SOURCE);
        const subsets = workspace.getBlocksByType(Blocks.Names.NODE.SUBSET);
        const targets = workspace.getBlocksByType(Blocks.Names.NODE.TARGET);
        const nonNodeTopBlocks = workspace.getTopBlocks(false).filter(block => !Blocks.Types.isNodeBlock(block));

        if (sources.length === 0 || subsets.length === 0 || targets.length === 0) return true;
        if (sources.length > 0 && (sources[0] as NodeBlockSvg).getEdges().length === 0) return true;
        if (subsets.length > 0 && (subsets[0] as NodeBlockSvg).getEdges().length === 0) return true;
        if (targets.length > 0 && (targets[0] as NodeBlockSvg).getEdges().length === 0) return true;
        if (sources.length > 0 && subsets.length === 1 && targets.length > 0 && nonNodeTopBlocks.length === 1 && !subsets[0].getInput("FILTERS")?.connection?.isConnected()) return true;

        return false;
    }

    public static autoComplete(workspace: Blockly.WorkspaceSvg): void {
        Blockly.Events.setGroup(true);

        const verticalDistance = 60;
        const horizontalDistance = 80;

        const sources = workspace.getBlocksByType(Blocks.Names.NODE.SOURCE);
        const subsets = workspace.getBlocksByType(Blocks.Names.NODE.SUBSET);
        const targets = workspace.getBlocksByType(Blocks.Names.NODE.TARGET);

        const originalSource = sources.length > 0 ? sources[0] as NodeBlockSvg : null;
        const originalSubset = subsets.length > 0 ? subsets[0] as NodeBlockSvg : null;
        const originalTarget = targets.length > 0 ? targets[0] as NodeBlockSvg : null;

        const source = originalSource !== null ? originalSource : this.createBlockAtCoordinate(workspace, Blocks.Names.NODE.SOURCE) as NodeBlockSvg;
        const subset = originalSubset !== null ? originalSubset : this.createBlockAtCoordinate(workspace, Blocks.Names.NODE.SUBSET) as NodeBlockSvg;
        const target = originalTarget !== null ? originalTarget : this.createBlockAtCoordinate(workspace, Blocks.Names.NODE.TARGET) as NodeBlockSvg;

        if (originalTarget === null) {
            const targetBlocks = store.getState().blockly.targetBlocks;
            // we use the first target id that we get
            if (Object.keys(targetBlocks).length > 0) {
                const field = target.getField("LABEL") as FieldLabelTargetNode;
                field.setId(Object.keys(targetBlocks)[0]);
                field.setValue(Object.values(targetBlocks)[0]);
            }
        }

        const nonNodeTopBlocks = workspace.getTopBlocks(false).filter(block => !Blocks.Types.isNodeBlock(block));
        const subsetStatementInput = subset.getInput("FILTERS");
        // we attach the first non-node block to the subset block
        if (nonNodeTopBlocks.length > 0 && subsetStatementInput !== null) {
            // if there are already block in the subset statement we want to connect the new block to the last one
            if (subsetStatementInput.connection?.targetConnection !== null) {
                const lastConnection = subsetStatementInput.connection?.targetBlock()?.lastConnectionInStack(true);
                if (lastConnection) {
                    lastConnection.connect(nonNodeTopBlocks[0].previousConnection);
                }
            } else {
                subsetStatementInput.connection?.connect(nonNodeTopBlocks[0].previousConnection);
            }
        }

        // we move the nodes to the correct position
        if (originalSource === null) {
            if (originalSubset !== null) {
                source.moveTo(new Blockly.utils.Coordinate(subset.getRelativeToSurfaceXY().x - horizontalDistance - subset.getHeightWidth().width, subset.getRelativeToSurfaceXY().y - verticalDistance));
            } else if (originalTarget !== null) {
                source.moveTo(new Blockly.utils.Coordinate(target.getRelativeToSurfaceXY().x - 2 * horizontalDistance - target.getHeightWidth().width - subset.getHeightWidth().width, target.getRelativeToSurfaceXY().y - 2 * verticalDistance - target.getHeightWidth().height - subset.getHeightWidth().height));
            }
        }

        if (originalSubset === null) {
            if (originalSource !== null) {
                subset.moveTo(new Blockly.utils.Coordinate(source.getRelativeToSurfaceXY().x + horizontalDistance + source.getHeightWidth().width, source.getRelativeToSurfaceXY().y + source.getHeightWidth().height + verticalDistance));
            } else if (originalTarget !== null) {
                subset.moveTo(new Blockly.utils.Coordinate(target.getRelativeToSurfaceXY().x - horizontalDistance - subset.getHeightWidth().width, target.getRelativeToSurfaceXY().y - verticalDistance - subset.getHeightWidth().height));
            } else {
                subset.moveTo(new Blockly.utils.Coordinate(source.getHeightWidth().width + horizontalDistance, source.getHeightWidth().height + verticalDistance));
            }
        }

        if (originalTarget === null) {
            if (originalSubset !== null) {
                target.moveTo(new Blockly.utils.Coordinate(subset.getRelativeToSurfaceXY().x + horizontalDistance + subset.getHeightWidth().width, subset.getRelativeToSurfaceXY().y + subset.getHeightWidth().height + verticalDistance));
            } else if (originalSource !== null) {
                target.moveTo(new Blockly.utils.Coordinate(source.getRelativeToSurfaceXY().x + 2 * horizontalDistance + source.getHeightWidth().width + subset.getHeightWidth().width, source.getRelativeToSurfaceXY().y + 2 * verticalDistance + source.getHeightWidth().height + subset.getHeightWidth().height));
            } else {
                target.moveTo(new Blockly.utils.Coordinate(subset.getRelativeToSurfaceXY().x + subset.getHeightWidth().width + horizontalDistance, subset.getRelativeToSurfaceXY().y + subset.getHeightWidth().height + verticalDistance));
            }
        }

        this.connectNodes(source!, subset!, "OUTPUT", "INPUT");
        this.connectNodes(subset!, target!, "POSITIVE", "INPUT");

        if (originalSource === null || originalSubset === null || originalTarget === null) {
            workspace.scrollCenter();
        }

        Blockly.Events.setGroup(false);
    }

    protected static createBlockAtCoordinate(workspace: Blockly.WorkspaceSvg, blockType: string) {
        const block = workspace.newBlock(blockType);
        block.initSvg();
        block.render();
        return block;
    }

    protected static connectNodes(a: Blockly.BlockSvg, b: Blockly.BlockSvg, output: string, input: string) {
        if (Blocks.Types.isNodeBlock(a) && Blocks.Types.isNodeBlock(b)) {
            a.connectNode(b, output, input);
        }
    }
}