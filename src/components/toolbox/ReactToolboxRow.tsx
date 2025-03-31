import { ReactToolboxBlockItem } from "./ReactToolboxBlockItem";
import * as Blockly from "blockly/core";
import StarIconOutline from "@/assets/StarIconOutline.svg?react";
import { GenericBlockDefinition } from "@/blocks/toolbox/builder/definitions";

export function ReactToolboxRow(props: { block?: GenericBlockDefinition; variable?: Blockly.VariableModel | null }) {
    return (
        <div className="flex flex-col">
            <div className="flex flex-row items-center justify-between group gap-2">
                <ReactToolboxBlockItem block={props.block} variable={props.variable} />
                <StarIconOutline className="w-4 h-4 opacity-10 group-hover:visible invisible" />
            </div>
        </div>
    );
}
