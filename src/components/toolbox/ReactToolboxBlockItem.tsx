import { GenericBlockDefinition } from "@/blocks/toolbox/builder/definitions";
import { useSettings, useWorkspace } from "@/main";
import { ExternalFlyout } from "@/toolbox/external_flyout";
import * as Blockly from "blockly/core";
import { useEffect, useRef } from "react";

export function ReactToolboxBlockItem(props: {
    block?: GenericBlockDefinition;
    variable?: Blockly.VariableModel | null;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const { workspace } = useWorkspace();
    const flyoutRef = useRef<ExternalFlyout | null>(null);
    const { isInitialized: settingsInitialized } = useSettings();

    useEffect(() => {
        if (!workspace || !settingsInitialized || !ref.current) return;
        if (flyoutRef.current) return; // Prevent re-initialization

        flyoutRef.current = ExternalFlyout.inject(ref.current, workspace.options);
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

    return <div ref={ref} />;
}
