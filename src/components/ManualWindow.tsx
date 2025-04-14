import { useContext, useEffect, useImperativeHandle, useRef } from "react";
import { createPortal } from "react-dom";
import { ManualPage } from "./ManualPage";
import { HelpContext } from "@/context/manual/manual_context";

export interface ManualWindowRef {
    focus: () => void;
}

export function ManualWindow({ onClose, innerRef }: { onClose: () => void, innerRef?: React.RefObject<ManualWindowRef> }) {
    const containerEl = useRef(document.createElement("div"));
    containerEl.current.id = "container";
    const externalWindow = useRef<WindowProxy | null>(null);
    const { activePage } = useContext(HelpContext);

    useImperativeHandle(innerRef, () => ({
        focus: () => {
            if (externalWindow.current) {
                externalWindow.current.focus();
            }
        },
    }));

    useEffect(() => {
        externalWindow.current = window.open(
            "",
            "_blank",
            "width=600,height=700,left=200,top=200,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,popup=yes"
        );

        if (externalWindow.current) {
            const externalDocument = externalWindow.current.document;
            externalDocument.title = "Manual";

            Array.from(document.head.children).forEach((el) => {
                if (el.tagName === "STYLE" || el.tagName === "LINK") {
                    externalDocument.head.appendChild(el.cloneNode(true));
                }
            });

            const additionalStyles = document.createElement("style");
            additionalStyles.innerHTML = `
                #help-start {
                    max-height: calc(100% - 40px);
                    overflow-y: auto;
                }
                #container {
                    max-height: 100%;
                    overflow-y: hidden;
                }
            `;

            externalDocument.head.appendChild(additionalStyles);

            externalDocument.body.appendChild(containerEl.current);
            externalWindow.current.addEventListener("beforeunload", onClose);
        }
    }, []);

    useEffect(() => {
        if (activePage && externalWindow.current) {
            const element = externalWindow.current.document.getElementById(activePage.slice(1));
            if (element) {
                element.scrollIntoView({ behavior: "instant" });
            }
        }
    }, [activePage]);

    return createPortal(<ManualPage externalWindowRef={externalWindow} />, containerEl.current);
}
