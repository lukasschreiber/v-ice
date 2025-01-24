import { useContext } from "react";
import { HelpContext } from "./manual_context";

export const useHelp = () => {
    return useContext(HelpContext);
};