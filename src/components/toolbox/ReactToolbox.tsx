import { ToolboxDefinition } from "@/blocks/toolbox/builder/definitions";
import { ReactToolboxProvider } from "./ReactToolboxContext";
import { ReactToolboxStaticCategory } from "./ReactToolboxStaticCategory";
import { ReactToolboxDynamicCategory } from "./ReactToolboxDynamicCategory";
import { Layer } from "@/utils/zindex";

export function ReactToolbox(props: { definition: ToolboxDefinition }) {
    return (
        <ReactToolboxProvider>
            <div
                className="absolute top-0 right-0 w-fit h-fit bg-pink-300/50 p-2 flex gap-2 flex-col max-h-full overflow-y-auto"
                data-deletezone={true}
                style={{ zIndex: Layer.SearchOverlay }}
            >
                <div className="flex flex-col gap-2">
                    {props.definition.map((category, index) => {
                        if (category.kind === "static") {
                            return <ReactToolboxStaticCategory key={index} category={category} />;
                        } else {
                            return <ReactToolboxDynamicCategory key={index} category={category} />;
                        }
                    })}
                </div>
            </div>
        </ReactToolboxProvider>
    );
}
