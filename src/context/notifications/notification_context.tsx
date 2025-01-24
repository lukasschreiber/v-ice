import { createContext, useState, PropsWithChildren, useEffect, useContext, useRef } from "react";
import emitter from "./notification_emitter";
import { Notification } from "@/components/common/Notification";
import { WorkspaceContext } from "@/context/workspace_context";
import { createPortal } from "react-dom";
import { NotificationLocalStorageEntry, NotificationType, notificationConfig } from "./notification_config";
import { EvaluationAction, triggerAction } from "@/evaluation_emitter";

export interface INotificationContext {
    showNotification: (message: string, type?: NotificationType) => void;
}

export const NotificationContext = createContext<INotificationContext>({
    showNotification: () => {},
});

export const NotificationProvider = (props: PropsWithChildren) => {
    const [notification, setNotification] = useState({ message: "", visible: false });
    const { workspaceRef } = useContext(WorkspaceContext);
    const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());
    const [notificationState, setNotificationState] = useState<NotificationLocalStorageEntry>(
        {} as NotificationLocalStorageEntry
    );

    const LOCAL_STORAGE_KEY = "notification_state";

    // TODO: Move this to a use localStorage hook
    function readStateFromLocalstorage(): NotificationLocalStorageEntry | null {
        const entry = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (entry === null) return null;
        const parsed = JSON.parse(entry) as NotificationLocalStorageEntry;
        setNotificationState(parsed);
        return parsed;
    }

    function writeStateToLocalstorage(settings: NotificationLocalStorageEntry) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    }

    const showNotification = (message: string, type?: NotificationType) => {
        let timeout = 2500;
        if (type !== undefined) {
            const timesTriggered = readStateFromLocalstorage()?.[type] ?? 0;
            const config = notificationConfig[type];
            const keys = Object.keys(config).map((key) => parseInt(key));
            const nextKey = keys.reduce((prev, curr) => (curr <= timesTriggered ? curr : prev));
            const configTimeout = config[nextKey];
            if (configTimeout === null) return;
            timeout = configTimeout;
            setNotificationState(oldState => ({ ...oldState, [type]: timesTriggered + 1 }));
        }

        triggerAction(EvaluationAction.SentNotification, { message })
        setNotification({ message, visible: true });
        activeTimeouts.current.forEach(clearTimeout);
        activeTimeouts.current.clear();
        const timeoutId = setTimeout(() => {
            setNotification({ message: "", visible: false });
            activeTimeouts.current.delete(timeoutId);
        }, timeout);
        activeTimeouts.current.add(timeoutId);
    };
    
    useEffect(() => {
        writeStateToLocalstorage(notificationState);
    }, [notificationState]);

    useEffect(() => {
        emitter.on("showNotification", showNotification);
        if (!readStateFromLocalstorage()) {
            writeStateToLocalstorage(notificationState);
        }

        window.addEventListener("storage", (event: StorageEvent) => {
            if (event.key !== LOCAL_STORAGE_KEY || event.newValue === null) return;
            setNotificationState(JSON.parse(event.newValue) as NotificationLocalStorageEntry);
        });

        return () => {
            emitter.off("showNotification", showNotification);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {props.children}
            {notification.visible &&
                createPortal(
                    <Notification message={notification.message} />,
                    workspaceRef.current?.getInjectionDiv() ?? document.body
                )}
        </NotificationContext.Provider>
    );
};
