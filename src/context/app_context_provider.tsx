import { SettingsProvider } from "@/context/settings/settings_context";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { WorkspaceProvider } from "@/context/workspace_context";
import { NotificationProvider } from "../context/notifications/notification_context";
import { HelpProvider } from "../context/manual/manual_context";
import { setDebugger } from "./settings/settings_slice";
import React, { useEffect } from "react";
import { ApplicationContext } from "@/store/hooks";
import { LogLevel } from "@/utils/logger";

export function ApplicationContextProvider(
    props: React.ComponentPropsWithoutRef<"div"> & {
        debug?: {
            ast: boolean;
            blocklyJson: boolean;
            blocklyXml: boolean;
            code: boolean;
        };
        logLevel?: LogLevel;
    }
) {
    useEffect(() => {
        store.dispatch(
            setDebugger(
                props.debug ?? {
                    ast: false,
                    blocklyJson: false,
                    blocklyXml: false,
                    code: false,
                    logLevel: props.logLevel ?? LogLevel.INFO,
                }
            )
        );
    }, [props.debug, props.logLevel]);

    return (
        <Provider store={store} context={ApplicationContext}>
            <SettingsProvider>
                <WorkspaceProvider>
                    <NotificationProvider>
                        <HelpProvider>{props.children}</HelpProvider>
                    </NotificationProvider>
                </WorkspaceProvider>
            </SettingsProvider>
        </Provider>
    );
}
