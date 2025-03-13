import { SettingsContext } from "@/context/settings/settings_context";
import { WorkspaceContext } from "@/context/workspace_context";
import { useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@v-ice/commons";
import { deserializeWorkspace, ISerializedWorkspace, serializeWorkspace } from "@/serializer";
import { useSelector } from "@/store/hooks";

export function useWorkspacePersister() {
    const { settings } = useContext(SettingsContext);
    const { workspaceRef, isInitialized: isWorkspaceInitialized } = useContext(WorkspaceContext);
    const isSourceTableInitialized = useSelector((state) => state.sourceTable.initialized);
    const [savedWorkspace, setSavedWorkspace] = useLocalStorage<ISerializedWorkspace | null>(
        settings.persistenceKey,
        null
    );
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (
            workspaceRef.current &&
            workspaceRef.current.getAllBlocks().length === 0 &&
            !initialized &&
            isWorkspaceInitialized &&
            isSourceTableInitialized &&
            savedWorkspace &&
            settings.saveWorkspace &&
            settings.persistenceKey &&
            settings.persistenceKey.length > 0
        ) {
            deserializeWorkspace(workspaceRef.current, savedWorkspace);
            setInitialized(true);
        } else if (isWorkspaceInitialized && workspaceRef.current && isSourceTableInitialized) {
            // in that case we do not have to do anything and are ready
            setInitialized(true);
        }
    }, [
        workspaceRef,
        isWorkspaceInitialized,
        settings.saveWorkspace,
        settings.persistenceKey,
        isSourceTableInitialized,
    ]);

    useEffect(() => {
        if (
            workspaceRef.current &&
            settings.saveWorkspace &&
            settings.persistenceKey &&
            settings.persistenceKey.length > 0 &&
            initialized
        ) {
            workspaceRef.current.addChangeListener(() => {
                setSavedWorkspace(workspaceRef.current ? serializeWorkspace(workspaceRef.current) : null);
            });
        }
    }, [workspaceRef, settings.saveWorkspace, settings.persistenceKey, initialized]);

    return { isWorkspaceLoaded: initialized };
}
