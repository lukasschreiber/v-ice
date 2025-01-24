import { SettingsProvider } from "@/store/settings/settings_context";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { WorkspaceProvider } from "@/workspace_context";
import { NotificationProvider } from "./notifications/notification_context";
import { HelpProvider } from "./manual/manual_context";

export function ApplicationContextProvider(props: React.ComponentPropsWithoutRef<"div">) {

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
