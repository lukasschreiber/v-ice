import { IStaticToolboxCategory } from "@/blocks/toolbox/builder/definitions";
import { ReactToolboxRow } from "./ReactToolboxRow";
import * as Blockly from "blockly/core";
import { useWorkspace } from "@/main";

export function ReactToolboxStaticCategory(props: {category: IStaticToolboxCategory}) {
    const { isInitialized } = useWorkspace();

    if (!isInitialized) {
        return null;
    }

    return (
        <div>
            <h3>{Blockly.utils.parsing.replaceMessageReferences(props.category.name)}</h3>
            <div className="flex flex-col gap-2">
                {props.category.blocks.map((block, index) => {
                    return <ReactToolboxRow key={index} block={block} />;
                })}
            </div>
        </div>
    );
}
