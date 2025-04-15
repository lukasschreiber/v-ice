import { ToolboxDefinition } from "@/blocks/toolbox/builder/definitions";
import { ReactToolboxProvider } from "./ReactToolboxContext";
import { ReactToolboxStaticCategory } from "./ReactToolboxStaticCategory";
import { ReactToolboxDynamicCategory } from "./ReactToolboxDynamicCategory";
import { Layer } from "@/utils/zindex";
import { useSettings, useWorkspace } from "@/main";
import { evaluateIsHiddenFunc, hasIsHiddenFunc } from "@/blocks/toolbox/utils";
import { useSelector } from "@/store/hooks";
import { useMemo } from "react";

export function ReactToolbox(props: { definition: ToolboxDefinition; offset: number }) {
    const { settings } = useSettings();
    const { workspace } = useWorkspace();
    const columns = useSelector((state) => state.sourceTable.columns);

    const categories = useMemo(() => {
        return props.definition.filter((category) => {
            if (hasIsHiddenFunc(category)) {
                return !evaluateIsHiddenFunc(category, workspace, columns);
            }

            return true;
        });
    }, [props.definition, workspace, columns]);

    return (
        <ReactToolboxProvider>
            <div
                className="absolute top-0 w-fit p-2 flex gap-2 flex-col max-h-full overflow-y-auto bg-toolbox-bg/90 toolbox-container"
                data-deletezone={true}
                style={{
                    zIndex: Layer.Toolbox,
                    left: settings.toolboxPosition === "left" ? props.offset : "unset",
                    right: settings.toolboxPosition === "right" ? props.offset : "unset",
                    height: `calc(100% - 2px)`,
                    top: "1px",
                }}
            >
                <div className="flex flex-col gap-2">
                    {categories.map((category, index) => {
                        if (category.kind === "static") {
                            return <ReactToolboxStaticCategory key={index} category={category} />;
                        } else {
                            // return null;
                            return <ReactToolboxDynamicCategory key={index} category={category} />;
                        }
                    })}
                </div>
            </div>
        </ReactToolboxProvider>
    );
}
