import { IStaticToolboxCategory } from "@/blocks/toolbox/builder/definitions";
import { ReactToolboxRow } from "./ReactToolboxRow";
import * as Blockly from "blockly/core";
import { useWorkspace } from "@/main";
import { useSelector } from "@/store/hooks";
import { useEffect, useMemo, useState } from "react";

export function ReactToolboxStaticCategory(props: {category: IStaticToolboxCategory}) {
    const { isInitialized, workspace } = useWorkspace();
    const variablesReady = useSelector((state) => state.blockly.featuresReady.variables);
    const [workspaceChange, setWorkspaceChange] = useState(false);
    const needsUpdate = workspaceChange && workspace && isInitialized && variablesReady;

    const blocks = useMemo(() => {
        if (!needsUpdate) return [];
        return props.category.blocks
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
            <h3 className="text-xs font-bold mb-2">{Blockly.utils.parsing.replaceMessageReferences(props.category.name)}</h3>
            <div className="flex flex-col gap-2">
                {blocks.map((block, index) => {
                    return <ReactToolboxRow key={index} block={block} />;
                })}
            </div>
        </div>
    );
}
