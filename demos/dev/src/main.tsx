import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import { VICEProvider } from "@/main";
import { TabContextProvider } from "./components/tabs/TabContext";
import "./style.css";
import { DataContextProvider } from "./components/DataContext";
import { StoreWorkspaceContextProvider } from "./components/StoreWorkspaceContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <VICEProvider
            debug={{
                ast: true,
                blocklyJson: true,
                blocklyXml: true,
                code: true,
            }}
        >
            <TabContextProvider>
                <DataContextProvider>
                    <StoreWorkspaceContextProvider>
                        <App />
                    </StoreWorkspaceContextProvider>
                </DataContextProvider>
            </TabContextProvider>
        </VICEProvider>
    </React.StrictMode>
);
