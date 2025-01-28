import * as Blockly from 'blockly/core';
import { createContext, useRef, useState } from 'react';

interface IWorkspaceContext {
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
    debug: boolean;
    setDebug: (debug: boolean) => void;
}

export const WorkspaceContext = createContext<IWorkspaceContext>({
    workspaceRef: { current: null },
    debug: false,
    setDebug: () => {},
});

export function WorkspaceProvider(
    props: React.ComponentPropsWithoutRef<"div">
) {
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const [debug, setDebug] = useState(false);

    return (
        <WorkspaceContext.Provider value={{ workspaceRef, debug, setDebug }}>
            {props.children}
        </WorkspaceContext.Provider>
    );
}