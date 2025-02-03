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
    const [savedCurrentDataSetName, setSavedCurrentDataSetName] = useLocalStorage<string | null>(
        "dev-saved-current-data-set-name",
        null
    );
    const [initialized, setInitialized] = useState(false);
    const { dataIsInitialized, sourceName } = useContext(DataContext);
    const [savedWorkspaces, setSavedWorkspaces] = useLocalStorage<{ name: string; workspace: ISerializedWorkspace, datasetName: string }[]>(
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
            if (savedCurrentDataSetName === sourceName) {
                load(savedCurrentWorkspace);
            }

            setInitialized(true);
        }

        if (workspace && (savedCurrentDataSetName === null || savedCurrentDataSetName === sourceName)) {
            workspace?.addChangeListener(() => {
                setSavedCurrentWorkspace(save());
                setSavedCurrentDataSetName(sourceName);
            });
        }
    }, [workspace, dataIsInitialized, sourceName]);

    return (
        <StoreWorkspaceContext.Provider value={{ savedCurrentWorkspace, setSavedCurrentWorkspace, savedWorkspaces, setSavedWorkspaces, savedCurrentDataSetName, setSavedCurrentDataSetName }}>
            {props.children}
        </StoreWorkspaceContext.Provider>
    );
}

export const StoreWorkspaceContext = createContext<{
    savedCurrentWorkspace: ISerializedWorkspace | null;
    setSavedCurrentWorkspace: React.Dispatch<React.SetStateAction<ISerializedWorkspace | null>>;
    savedCurrentDataSetName: string | null;
    setSavedCurrentDataSetName: React.Dispatch<React.SetStateAction<string | null>>;
    savedWorkspaces: { name: string; workspace: ISerializedWorkspace, datasetName: string }[];
    setSavedWorkspaces: React.Dispatch<React.SetStateAction<{ name: string; workspace: ISerializedWorkspace, datasetName: string }[]>>;
}>({
    savedCurrentWorkspace: null,
    setSavedCurrentWorkspace: () => {},
    savedCurrentDataSetName: null,
    setSavedCurrentDataSetName: () => {},
    savedWorkspaces: [],
    setSavedWorkspaces: () => {},
});