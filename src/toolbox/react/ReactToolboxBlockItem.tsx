import { GenericBlockDefinition } from "@/toolbox/builder/definitions";
import { useSettings, useWorkspace } from "@/main";
import { getBlockHeightWidth } from "@/renderer/block_metric_approximator";
import { useSelector } from "@/store/hooks";
import { SingleBlockFlyout } from "@/toolbox/react/single_block_flyout";
import * as Blockly from "blockly/core";
import { useEffect, useMemo, useRef } from "react";

export function ReactToolboxBlockItem(props: {
    block?: GenericBlockDefinition;
    variable?: Blockly.VariableModel | null;
    width?: number;
    height?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const { workspace } = useWorkspace();
    const flyoutRef = useRef<SingleBlockFlyout | null>(null);
    const { isInitialized: settingsInitialized } = useSettings();
    const scale = useSelector((state) => state.settings.settings.zoom);

    useEffect(() => {
        if (!workspace || !settingsInitialized || !ref.current) return;
        if (flyoutRef.current) return; // Prevent re-initialization

        flyoutRef.current = SingleBlockFlyout.inject(ref.current, workspace.options);
        flyoutRef.current.init(workspace);

        if (props.variable) {
            flyoutRef.current.addVariable(props.variable);
        } else if (props.block) {
            flyoutRef.current.addBlock(props.block);
        }

        return () => {
            flyoutRef.current?.dispose();
            flyoutRef.current = null;
        };
    }, [workspace, settingsInitialized, props.block, props.variable]);

    const metrics = useMemo(() => {
        if (props.width && props.height) return { width: props.width, height: props.height };
        if (!props.block) return { width: 0, height: 0 };
        return getBlockHeightWidth(props.block, scale);
    }, [scale, props.block]);

    useEffect(() => {
        const globalClickHandler = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest(".renderer-renderer") !== null) return;
            // hide all dropdowns, etc. when clicking outside the workspace
            flyoutRef.current?.getWorkspace()?.hideChaff();
        };

        const container = ref.current?.closest(".toolbox-container");

        const scrollHandler = () => {
            const workspace = flyoutRef.current?.getWorkspace();
            if (!workspace) return;
            Blockly.WidgetDiv.hideIfOwnerIsInWorkspace(workspace);
        };

        document.addEventListener("click", globalClickHandler);
        container?.addEventListener("scroll", scrollHandler);
        return () => {
            container?.removeEventListener("scroll", scrollHandler);
            document.removeEventListener("click", globalClickHandler);
        };
    }, [flyoutRef.current, ref.current]);

    return (
        <div
            ref={ref}
            className="renderer-renderer light-theme"
            style={{
                width: `${metrics.width}px`,
                height: `${metrics.height}px`,
            }}
        />
    );
}
