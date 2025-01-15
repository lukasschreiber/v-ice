import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import { BlocklyProvider } from "@/main";
import { TabContextProvider } from "./components/tabs/TabContext";
import "./style.css";
import { DataContextProvider } from "./components/DataContext";
import { StoreWorkspaceContextProvider } from "./components/StoreWorkspaceContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BlocklyProvider>
            <TabContextProvider>
                <DataContextProvider>
                    <StoreWorkspaceContextProvider>
                        <App />
                    </StoreWorkspaceContextProvider>
                </DataContextProvider>
            </TabContextProvider>
        </BlocklyProvider>
    </React.StrictMode>
);
