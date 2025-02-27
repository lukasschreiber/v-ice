import { SettingsProvider } from "@/context/settings/settings_context";
import { Provider, ReactReduxContextValue } from "react-redux";
import { RootState, store } from "@/store/store";
import { WorkspaceProvider } from "@/context/workspace_context";
import { NotificationProvider } from "../context/notifications/notification_context";
import { HelpProvider } from "../context/manual/manual_context";
import { setDebugger } from "./settings/settings_slice";
import React, { useEffect } from "react";

const ApplicationContext = React.createContext<ReactReduxContextValue<RootState> | null>(null);

export function ApplicationContextProvider(props: React.ComponentPropsWithoutRef<"div"> & {debug?: {
    ast: boolean;
    blocklyJson: boolean;
    blocklyXml: boolean;
    code: boolean;
}}) {

    useEffect(() => {
        store.dispatch(setDebugger(props.debug ?? {
            ast: false,
            blocklyJson: false,
            blocklyXml: false,
            code: false
        }));
    }, [props.debug]);

    return (
        <Provider store={store} context={ApplicationContext}>
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
