import { useContext } from "react";
import { HelpContext } from "./help_context";

export const useHelp = () => {
    return useContext(HelpContext);
};