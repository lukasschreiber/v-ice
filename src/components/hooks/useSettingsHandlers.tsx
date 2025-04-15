import { Settings } from "@/context/settings/settings";
import { ContinuousFlyout } from "@/toolbox/blockly/flyout";
import { ContinuousToolbox } from "@/toolbox/blockly/toolbox";
import * as Blockly from "blockly/core";
import { useEffect } from "react";

export function useSettingsHandlers(
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>,
    settings: Settings
) {
    useEffect(() => {
        const workspace = workspaceRef.current;
        if (!workspace) return;
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
        if (!workspace) return;

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
        if (!workspace) return;

        const newToolboxPosition =
            settings.toolboxPosition === "left" ? Blockly.TOOLBOX_AT_LEFT : Blockly.TOOLBOX_AT_RIGHT;
        // if (workspace.toolboxPosition === newToolboxPosition) return;

        workspace.toolboxPosition = newToolboxPosition;

        const toolbox = workspace.getToolbox() as ContinuousToolbox | null;

        if (!toolbox) return;
        toolbox.updateToolboxPosition(newToolboxPosition);

        const flyout = toolbox.getFlyout() as ContinuousFlyout | null;
        if (!flyout) return;
        flyout.updateToolboxPosition(newToolboxPosition);

        workspace.resize();
        workspace.scrollCenter();
    }, [settings.toolboxPosition, workspaceRef]);

    useEffect(() => {
        const styleId = "disable-links-style";
        const existingStyle = document.getElementById(styleId);

        // Remove the style if it already exists
        if (existingStyle) {
            existingStyle.remove();
        }

        // Add the style only if disableLinks is true
        if (settings.disableLinks) {
            const style = document.createElement("style");
            style.id = styleId;
            style.innerHTML = `
            .blocklyLinkCanvas {
                display: none !important;
            }`;
            document.head.appendChild(style);
        }
    }, [workspaceRef, settings.disableLinks]);

    useEffect(() => {
        const toolboxVisible = settings.toolboxVisible && settings.toolboxVersion === "standard";

        const scrollbars = document.querySelectorAll<HTMLElement>(".blocklyFlyoutScrollbar");
        const flyout = workspaceRef.current?.getToolbox()?.getFlyout() as ContinuousFlyout | null;
        const definition = flyout?.getDefintion();

        if (flyout && definition && toolboxVisible) {
            flyout.show(definition);
            scrollbars.forEach((scrollbar) => {
                scrollbar.style.display = "block";
            });
        }

        if (flyout && definition && !toolboxVisible) {
            flyout.setVisible(false);
            flyout.show(definition);
            scrollbars.forEach((scrollbar) => {
                scrollbar.style.display = "none";
            });
            flyout.hide();
        }
    }, [workspaceRef, settings.toolboxVisible, settings.toolboxVersion]);

    useEffect(() => {
        workspaceRef.current?.render();
    }, [workspaceRef, settings.edgeKind, settings.edgeLineCap, settings.edgeMaxWidth, settings.edgeMinWidth]);
}
