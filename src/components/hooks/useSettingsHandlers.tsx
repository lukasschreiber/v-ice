import { Settings } from '@/context/settings/settings';
import { ContinuousFlyout } from '@/toolbox/flyout';
import { ContinuousToolbox } from '@/toolbox/toolbox';
import * as Blockly from 'blockly/core';
import { useEffect } from 'react';

export function useSettingsHandlers(workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>, settings: Settings) {
    useEffect(() => {
        const workspace = workspaceRef.current;
        if(!workspace) return;
        const oldX = workspace.scrollX;
        const oldY = workspace.scrollY;
        workspace.setScale(settings.zoom);
        workspace.scroll(oldX, oldY);
    }, [settings.zoom, workspaceRef]);

    useEffect(() => {
        const workspace = workspaceRef.current;
        const grid = workspace?.getGrid();
        if (!grid) return;
        grid.setLength(settings.grid ? settings.gridSize : 0);
        document.querySelectorAll(`#${grid.getPatternId()} line`).forEach((line) => {
            line.setAttribute("stroke", settings.gridColor);
        });
    }, [settings.grid, settings.gridSize, settings.gridColor, workspaceRef]);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if(!workspace) return;
        
        workspace.getGrid()?.setSnapToGrid(settings.snapToGrid);

        if (settings.snapToGrid)
            workspace.getAllBlocks().forEach((block) => {
                block.snapToGrid();
                //FIXME: we rerender the block to update eventual node links
                block.render();
            });
    }, [settings.snapToGrid, workspaceRef]);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if(!workspace) return;

        const newToolboxPosition = settings.toolboxPosition === "left" ? Blockly.TOOLBOX_AT_LEFT : Blockly.TOOLBOX_AT_RIGHT;
        // if (workspace.toolboxPosition === newToolboxPosition) return;

        workspace.toolboxPosition = newToolboxPosition;

        const toolbox = workspace.getToolbox() as ContinuousToolbox | null
        
        if (!toolbox) return;
        toolbox.updateToolboxPosition(newToolboxPosition);

        const flyout = toolbox.getFlyout() as ContinuousFlyout | null;
        if (!flyout) return;
        flyout.updateToolboxPosition(newToolboxPosition);

        workspace.resize();
        workspace.scrollCenter();
    }, [settings.toolboxPosition, workspaceRef]);
}