import { createContext, useState, PropsWithChildren, useContext, useEffect } from "react";
import { WorkspaceContext } from "@/context/workspace_context";
import { createPortal } from "react-dom";
import { ManualModal } from "@/components/ManualModal";
import emitter from "./manual_emitter";
import { EvaluationAction, triggerAction } from "@/evaluation_emitter";

export interface IHelpContext {
    openHelp: (activePage: string) => void;
    closeHelp: () => void;
    setHelpUrl: (url: string | null) => void;
    activePage: string | null;
    helpUrl: string | null;
}

export const HelpContext = createContext<IHelpContext>({
    openHelp: () => {},
    closeHelp: () => {},
    setHelpUrl: () => {},
    activePage: "",
    helpUrl: null,
});

export const HelpProvider = (props: PropsWithChildren) => {
    const [open, setOpen] = useState(false);
    const [activePage, setActivePage] = useState<string|null>(null);
    const [helpUrl, setHelpUrl] = useState<string|null>(null);
    const { workspaceRef } = useContext(WorkspaceContext);

    useEffect(() => {
        emitter.on("showHelp", openHelp);
        return () => {
            emitter.off("showHelp", openHelp);
        };
    }, []);

    function openHelp(activePage: string) {
        setActivePage(activePage);
        setOpen((old) => {
            if (!old) triggerAction(EvaluationAction.OpenHelp, { directLink: activePage })

            return true
        });


        const element = document.getElementById(activePage.slice(1));
        if (element) {
            element.scrollIntoView({ behavior: "instant" });
        }
    }

    function closeHelp() {
        setOpen(false);
        setActivePage(null);
    }

    return (
        <HelpContext.Provider value={{ openHelp, closeHelp, activePage, setHelpUrl, helpUrl }}>
            {props.children}
            {createPortal(
                <ManualModal open={open} onClose={() => closeHelp()} />,
                workspaceRef.current?.getInjectionDiv() ?? document.body
            )}
        </HelpContext.Provider>
    );
};
