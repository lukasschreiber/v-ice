import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { BlocklyProvider, HelpPage } from "@nephro-react/filters";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { EvaluationProvider } from "./store/EvaluationContext";
import { StartPage } from "./pages/StartPage";
import { EnterCodePage } from "./pages/EnterCodePage";
import { EvaluationPage } from "./pages/EvaluationPage";
import { SubmitPage } from "./pages/SubmitPage";

const router = createBrowserRouter([
    {
        path: "/",
        element: <StartPage />,
    },
    {
        path: "/enter",
        element: <EnterCodePage />,
    },
    {
        path: "/evaluation/:stage",
        element: <EvaluationPage />,
        children: [
            {
                path: ":taskId",
                element: <EvaluationPage />,
            },
        ],
    },
    {
        path: "/submit",
        element: <SubmitPage />,
    },
    {
        path: "/help",
        element: <HelpPage />,
    }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <EvaluationProvider>
            <BlocklyProvider>
                <RouterProvider router={router} />
            </BlocklyProvider>
        </EvaluationProvider>
    </React.StrictMode>
);
