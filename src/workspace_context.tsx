import * as Blockly from 'blockly/core';
import { createContext, useRef } from 'react';

interface IWorkspaceContext {
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
}

export const WorkspaceContext = createContext<IWorkspaceContext>({
    workspaceRef: { current: null },
});

export function WorkspaceProvider(
    props: React.ComponentPropsWithoutRef<"div">
) {
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

    return (
        <WorkspaceContext.Provider value={{ workspaceRef }}>
            {props.children}
        </WorkspaceContext.Provider>
    );
}