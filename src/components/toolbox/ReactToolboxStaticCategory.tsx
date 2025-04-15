import { IStaticToolboxCategory } from "@/blocks/toolbox/builder/definitions";
import { ReactToolboxRow } from "./ReactToolboxRow";
import * as Blockly from "blockly/core";
import { useWorkspace } from "@/main";
import { useSelector } from "@/store/hooks";
import { useEffect, useMemo, useState } from "react";
import { evaluateIsHiddenFunc, hasIsHiddenFunc } from "@/blocks/toolbox/utils";

export function ReactToolboxStaticCategory(props: {category: IStaticToolboxCategory}) {
    const { isInitialized, workspace } = useWorkspace();
    const variablesReady = useSelector((state) => state.blockly.featuresReady.variables);
    const [workspaceChange, setWorkspaceChange] = useState(false);
    const columns = useSelector((state) => state.sourceTable.columns);
    const needsUpdate = workspaceChange && workspace && isInitialized && variablesReady && columns;

    const blocks = useMemo(() => {
        if (!needsUpdate) return [];
        return props.category.blocks.filter((block) => {
            if (hasIsHiddenFunc(block)) {
                return !evaluateIsHiddenFunc(block, workspace, columns);
            }

            return true;
        })
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
            <div className="flex flex-col gap-1">
                {blocks.map((block, index) => {
                    return <ReactToolboxRow key={index} block={block} />;
                })}
            </div>
        </div>
    );
}
