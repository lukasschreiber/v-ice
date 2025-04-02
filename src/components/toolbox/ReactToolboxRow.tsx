import { ReactToolboxBlockItem } from "./ReactToolboxBlockItem";
import * as Blockly from "blockly/core";
import StarIconOutline from "@/assets/StarIconOutline.svg?react";
import StarIcon from "@/assets/StarIcon.svg?react";
import { GenericBlockDefinition } from "@/blocks/toolbox/builder/definitions";
import { useContext } from "react";
import { ReactToolboxContext } from "./ReactToolboxContext";

export function ReactToolboxRow(props: {
    block?: GenericBlockDefinition;
    variable?: Blockly.VariableModel | null;
    width?: number;
    height?: number;
    padding?: number;
}) {
    const { isBlockPinned, toggleBlockPinned } = useContext(ReactToolboxContext);

    return (
        <div
            style={{ height: (props.height ?? 40) + (props.padding ?? 0) * 2 }}
            className={`flex flex-row items-center justify-between group gap-2 px-2 rounded-md ${isBlockPinned(props.block) ? "bg-gray-100" : ""} hover:bg-gray-50`}
        >
            <ReactToolboxBlockItem
                block={props.block}
                variable={props.variable}
                width={props.width}
                height={props.height}
            />
            <button onClick={() => toggleBlockPinned(props.block)}>
                {isBlockPinned(props.block) ? (
                    <StarIcon className="w-4 h-4 text-yellow-600" />
                ) : (
                    <StarIconOutline className="w-4 h-4 opacity-10 group-hover:visible invisible" />
                )}
            </button>
        </div>
    );
}
