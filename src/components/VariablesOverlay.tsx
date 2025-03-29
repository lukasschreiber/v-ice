import { Layer } from "@/utils/zindex";
import { ReactToolboxBlockItem } from "./toolbox/ReactToolboxBlockItem";

export function VariablesOverlay() {
 
    return (
        <div className="fixed bottom-0 right-0 w-fit h-fit bg-pink-300/50 p-2" style={{ zIndex: Layer.SearchOverlay }}>
            Variables:
            <ReactToolboxBlockItem block={{ type: "comparison_equals" }} />
        </div>
    )
}