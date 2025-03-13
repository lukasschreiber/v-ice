import { createContext, useState, PropsWithChildren, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { ManualModal } from "@/components/ManualModal";
import emitter from "./manual_emitter";
import { EvaluationAction, triggerAction } from "@/evaluation_emitter";
import { ManualWindow, ManualWindowRef } from "@/components/ManualWindow";
import { info } from "@/utils/logger";

export interface IHelpContext {
    openHelp: (activePage: string) => void;
    closeHelp: () => void;
    setHelpUrl: (url: string | null) => void;
    setActivePage: (page: string | null) => void;
    activePage: string | null;
    helpUrl: string | null;
}

export const HelpContext = createContext<IHelpContext>({
    openHelp: () => {},
    closeHelp: () => {},
    setHelpUrl: () => {},
    setActivePage: () => {},
    activePage: "",
    helpUrl: null,
});

export const HelpProvider = (props: PropsWithChildren) => {
    const [open, setOpen] = useState(false);
    const [activePage, setActivePage] = useState<string | null>(null);
    const [helpUrl, setHelpUrl] = useState<string | null>(null);
    const [isDocked, setIsDocked] = useState(true);
    const externalWindowRef = useRef<ManualWindowRef>(null);

    useEffect(() => {
        emitter.on("showHelp", openHelp);
        return () => {
            emitter.off("showHelp", openHelp);
        };
    }, []);

    const openHelp = useCallback(
        (activePage: string) => {
            setActivePage(activePage);
            if (isDocked) {
                setOpen((old) => {
                    if (!old) triggerAction(EvaluationAction.OpenHelp, { directLink: activePage });

                    return true;
                });

                const element = document.getElementById(activePage.slice(1));
                if (element) {
                    element.scrollIntoView({ behavior: "instant" });
                }
                info(`Opened help page ${activePage}`).log();
            } else {
                info(`Opened help page ${activePage} (undocked)`).log();
            }

            console.log(externalWindowRef.current);
            externalWindowRef.current?.focus();
        },
        [isDocked]
    );

    function closeHelp() {
        setOpen(false);
        setActivePage(null);
    }

    function undockHelp() {
        setIsDocked(false);
    }

    function closeExternalHelpWindow() {
        setIsDocked(true);
    };

    return (
        <HelpContext.Provider value={{ openHelp, closeHelp, activePage, setHelpUrl, helpUrl, setActivePage }}>
            {props.children}
            {createPortal(
                <ManualModal open={isDocked && open} onClose={() => closeHelp()} onUndock={() => undockHelp()} />,
                document.body
            )}
            {!isDocked && open && <ManualWindow onClose={() => closeExternalHelpWindow()} innerRef={externalWindowRef} />}
        </HelpContext.Provider>
    );
};
