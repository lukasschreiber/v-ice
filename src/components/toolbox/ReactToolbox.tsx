import { ToolboxDefinition } from "@/blocks/toolbox/builder/definitions";
import { ReactToolboxProvider } from "./ReactToolboxContext";

export function ReactToolbox(props: {definition: ToolboxDefinition}) {
    return (
        <ReactToolboxProvider>
            {props.definition.map((category, index) => {
                if (category.kind === "static") {
                    return <div key={index}>{category.name}</div>;
                } else {
                    return <div key={index}>Unrenderable: {category.name}</div>;
                }
            })}
        </ReactToolboxProvider>
    );
}
