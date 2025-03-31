import { GenericBlockDefinition } from "@/blocks/toolbox/builder/definitions";
import { useSettings, useWorkspace } from "@/main";
import { ExternalFlyout } from "@/toolbox/external_flyout";
import * as Blockly from "blockly/core";
import { useEffect, useRef, useState } from "react";

export function ReactToolboxBlockItem(props: {
    block?: GenericBlockDefinition;
    variable?: Blockly.VariableModel | null;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const { workspace } = useWorkspace();
    const flyoutRef = useRef<ExternalFlyout | null>(null);
    const [initialized, setInitialized] = useState(false);
    const { isInitialized: settingsIninitialized } = useSettings();

    useEffect(() => {
        const div = ref.current;
        if (div && workspace && !initialized && settingsIninitialized) {
            setInitialized(true);
            flyoutRef.current = ExternalFlyout.inject(div, workspace.options);
            flyoutRef.current.init(workspace);
            if (props.variable) {
                flyoutRef.current.addVariable(props.variable);
            } else if (props.block) {
                flyoutRef.current.addBlock(props.block);
            }
        }
    }, [ref.current, workspace, props.block, initialized, settingsIninitialized]);

    return <div ref={ref} className="" />;
}
