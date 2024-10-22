import { Settings } from '@/store/settings/settings';
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
}