import { ReactToolboxBlockItem } from "./ReactToolboxBlockItem";
import * as Blockly from "blockly/core";
import StarIconOutline from "@/assets/StarIconOutline.svg?react";
import StarIcon from "@/assets/StarIcon.svg?react";
import { GenericBlockDefinition } from "@/blocks/toolbox/builder/definitions";
import { useContext } from "react";
import { ReactToolboxContext } from "./ReactToolboxContext";

export function ReactToolboxRow(props: { block?: GenericBlockDefinition; variable?: Blockly.VariableModel | null }) {
    const { isBlockPinned, toggleBlockPinned } = useContext(ReactToolboxContext);

    return (
        <div className="flex flex-col">
            <div className="flex flex-row items-center justify-between group gap-2">
                <ReactToolboxBlockItem block={props.block} variable={props.variable} />
                <button onClick={() => toggleBlockPinned(props.block)}>
                    {isBlockPinned(props.block) ? (
                        <StarIcon className="w-4 h-4 text-yellow-600" />
                    ) : (
                        <StarIconOutline className="w-4 h-4 opacity-10 group-hover:visible invisible" />
                    )}
                </button>
            </div>
        </div>
    );
}
