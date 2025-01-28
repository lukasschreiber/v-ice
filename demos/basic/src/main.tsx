import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import { VICEProvider } from "@/main";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <VICEProvider>
            <App />
        </VICEProvider>
    </React.StrictMode>
);
