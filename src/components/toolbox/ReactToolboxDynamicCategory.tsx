import { IDynamicToolboxCategory } from "@/blocks/toolbox/builder/definitions";
import { ReactToolboxRow } from "./ReactToolboxRow";
import { DynamicToolboxCategory } from "@/blocks/toolbox/categories/dynamic_category";
import { useWorkspace } from "@/main";
import * as Blockly from "blockly/core";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "@/store/hooks";

export function ReactToolboxDynamicCategory<T extends DynamicToolboxCategory>(props: {
    category: IDynamicToolboxCategory<T>;
}) {
    const { workspace, isInitialized } = useWorkspace();
    const variablesReady = useSelector((state) => state.blockly.featuresReady.variables);
    const [workspaceChange, setWorkspaceChange] = useState(false);
    const needsUpdate = workspaceChange && workspace && isInitialized && variablesReady;

    const blocks = useMemo(() => {
        if (!needsUpdate) return [];
        return props.category.instance.getBlocks(workspace);
    }, [needsUpdate]);

    useEffect(() => {
        if (workspace) {
            const changeListener = () => setWorkspaceChange(true);
            workspace.addChangeListener(changeListener);
            return () => workspace.removeChangeListener(changeListener);
        }
    }, [workspace]);

    if (!needsUpdate) {
        return null;
    }

    return (
        <div>
            <h3>{Blockly.utils.parsing.replaceMessageReferences(props.category.name)}</h3>
            <div className="flex flex-col gap-2">
                {blocks.map((block, index) => {
                    return <ReactToolboxRow key={index} block={block} />;
                })}
            </div>
        </div>
    );
}
