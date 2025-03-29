import { GenericBlockDefinition } from "@/blocks/toolbox/toolbox_definition";
import { useSettings, useWorkspace } from "@/main";
import { ExternalFlyout } from "@/toolbox/external_flyout";
import { useEffect, useRef, useState } from "react";

export function ReactToolboxBlockItem(props: { block: GenericBlockDefinition }) {
    const ref = useRef<HTMLDivElement>(null)
    const { workspace } = useWorkspace()
    const flyoutRef = useRef<ExternalFlyout | null>(null)
    const [initialized, setInitialized] = useState(false)
    const {isInitialized: settingsIninitialized} = useSettings()

    useEffect(() => {
        const div = ref.current;
        if (div && workspace && !initialized && settingsIninitialized) {
            setInitialized(true)
            flyoutRef.current = ExternalFlyout.inject(div, workspace.options);
            flyoutRef.current.setTargetWorkspace(workspace);
            flyoutRef.current.addBlock(props.block);
        }
    }, [ref.current, workspace, props.block, initialized, settingsIninitialized])

    return <div ref={ref} className="h-[50px] w-[200px]" />
}