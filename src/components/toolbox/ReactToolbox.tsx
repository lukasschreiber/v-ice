import { ToolboxDefinition } from "@/blocks/toolbox/builder/definitions";
import { ReactToolboxProvider } from "./ReactToolboxContext";
import { ReactToolboxStaticCategory } from "./ReactToolboxStaticCategory";
import { ReactToolboxDynamicCategory } from "./ReactToolboxDynamicCategory";
import { Layer } from "@/utils/zindex";

export function ReactToolbox(props: { definition: ToolboxDefinition, offset: number }) {
    return (
        <ReactToolboxProvider>
            <div
                className="absolute top-0 w-fit h-full p-2 flex gap-2 flex-col max-h-full overflow-y-auto bg-toolbox-bg/90"
                data-deletezone={true}
                style={{ zIndex: Layer.Toolbox, left: props.offset }}
            >
                <div className="flex flex-col gap-2">
                    {props.definition.map((category, index) => {
                        if (category.kind === "static") {
                            return <ReactToolboxStaticCategory key={index} category={category} />;
                        } else {
                            return null;
                            // return <ReactToolboxDynamicCategory key={index} category={category} />;
                        }
                    })}
                </div>
            </div>
        </ReactToolboxProvider>
    );
}
