import { DefaultToolbox } from "@/blocks/toolbox/default_toolbox";
import { ReactToolbox } from "./toolbox/ReactToolbox";

export function ToolboxOverlay() {
    return <ReactToolbox definition={DefaultToolbox} />;
}