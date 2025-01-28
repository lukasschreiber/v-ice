import { SettingsProvider } from "@/context/settings/settings_context";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { WorkspaceProvider } from "@/context/workspace_context";
import { NotificationProvider } from "../context/notifications/notification_context";
import { HelpProvider } from "../context/manual/manual_context";
import { setDebugger } from "./settings/settings_slice";
import React, { useEffect } from "react";

export function ApplicationContextProvider(props: React.ComponentPropsWithoutRef<"div"> & {debug?: boolean}) {

    useEffect(() => {
        store.dispatch(setDebugger(props.debug ?? false));
    }, [props.debug]);

    return (
        <Provider store={store}>
            <SettingsProvider>
                <WorkspaceProvider>
                    <NotificationProvider>
                        <HelpProvider>
                            {props.children}
                        </HelpProvider>
                    </NotificationProvider>
                </WorkspaceProvider>
            </SettingsProvider>
        </Provider>
    );
}
