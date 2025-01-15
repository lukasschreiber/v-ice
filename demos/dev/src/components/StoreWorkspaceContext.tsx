import React, { createContext, useContext, useEffect, useState } from "react";
import { ISerializedWorkspace, useWorkspace } from "v-ice";
import { useLocalStorage } from "v-ice-commons";
import { DataContext } from "./DataContext";

export function StoreWorkspaceContextProvider(props: React.PropsWithChildren<{}>) {
    const { workspace, load, save } = useWorkspace();

    const [savedCurrentWorkspace, setSavedCurrentWorkspace] = useLocalStorage<ISerializedWorkspace | null>(
        "dev-saved-current-workspace",
        null
    );
    const [initialized, setInitialized] = useState(false);
    const { dataIsInitialized } = useContext(DataContext);
    const [savedWorkspaces, setSavedWorkspaces] = useLocalStorage<{ name: string; worksapce: ISerializedWorkspace }[]>(
        "dev-saved-workspaces",
        []
    );

    useEffect(() => {
        if (
            workspace &&
            savedCurrentWorkspace &&
            workspace.getAllBlocks().length === 0 &&
            !initialized &&
            dataIsInitialized
        ) {
            load(savedCurrentWorkspace);
            setInitialized(true);
            workspace?.addChangeListener(() => {
                setSavedCurrentWorkspace(save());
            });
        }
    }, [workspace, dataIsInitialized]);

    return (
        <StoreWorkspaceContext.Provider value={{ savedCurrentWorkspace, setSavedCurrentWorkspace, savedWorkspaces, setSavedWorkspaces }}>
            {props.children}
        </StoreWorkspaceContext.Provider>
    );
}

export const StoreWorkspaceContext = createContext<{
    savedCurrentWorkspace: ISerializedWorkspace | null;
    setSavedCurrentWorkspace: React.Dispatch<React.SetStateAction<ISerializedWorkspace | null>>;
    savedWorkspaces: { name: string; worksapce: ISerializedWorkspace }[];
    setSavedWorkspaces: React.Dispatch<React.SetStateAction<{ name: string; worksapce: ISerializedWorkspace }[]>>;
}>({
    savedCurrentWorkspace: null,
    setSavedCurrentWorkspace: () => {},
    savedWorkspaces: [],
    setSavedWorkspaces: () => {},
});