import * as Blockly from 'blockly/core';
import { createContext, useRef, useState } from 'react';

interface IWorkspaceContext {
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
    isInitialized: boolean;
    setInitialized: (initialized: boolean) => void;
}

export const WorkspaceContext = createContext<IWorkspaceContext>({
    workspaceRef: { current: null },
    isInitialized: false,
    setInitialized: () => {}
});

export function WorkspaceProvider(
    props: React.ComponentPropsWithoutRef<"div">
) {
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    return (
        <WorkspaceContext.Provider value={{ workspaceRef, isInitialized, setInitialized: setIsInitialized }}>
            {props.children}
        </WorkspaceContext.Provider>
    );
}