import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import { BlocklyProvider } from "@/main";
import { TabContextProvider } from "./components/tabs/TabContext";
import "./style.css";
import { DataContextProvider } from "./components/DataContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BlocklyProvider>
            <TabContextProvider>
                <DataContextProvider>
                    <App />
                </DataContextProvider>
            </TabContextProvider>
        </BlocklyProvider>
    </React.StrictMode>
);
