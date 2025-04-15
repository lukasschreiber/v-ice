import { GenericBlockDefinition } from "@/toolbox/builder/definitions";
import * as Blockly from "blockly/core";
import types from "@/data/types";
import { Blocks } from "@/blocks";
import { blockDefinitionToBlockState } from "@/toolbox/utils";

export function createUsedDummyVariables(block: GenericBlockDefinition, workspace: Blockly.WorkspaceSvg) {
    const enumNames = Array.from(
        new Set(
            [...JSON.stringify(block).matchAll(/Enum<.*?>/g)].map((match) =>
                match[0].replace("Enum<", "").replace(">", "")
            )
        )
    );

    enumNames.forEach((enumName) => {
        if (!types.registry.getEnum(enumName)) {
            // TODO: This is a hack just for now, values must be inferred from the block definition
            types.registry.registerEnum(enumName, ["Augsburg"]);
        }
    });

    function createUsedVariables(block: Blockly.serialization.blocks.State) {
        if (block.type === Blocks.Names.VARIABLE.GET) {
            const variable = block.fields?.VAR;
            if (variable) {
                let id = variable.id;
                if (!workspace.getVariableById(variable.id)) {
                    const newVariable = workspace.createVariable(variable.name, variable.type, variable.id);
                    id = newVariable.getId();
                }

                block.fields!["VAR"] = {
                    value: variable.name,
                    id: id,
                };

                block.fields!["TYPE"] = {
                    value: variable.type,
                };
            }
        }

        if (block.inputs) {
            for (const inputName in block.inputs) {
                const child = block.inputs[inputName];
                if (child.block) createUsedVariables(child.block);
                if (child.shadow) createUsedVariables(child.shadow);
            }
        } else if (block.next) {
            if (block.next.block) createUsedVariables(block.next.block);
            if (block.next.shadow) createUsedVariables(block.next.shadow);
        } else {
            return;
        }
    }

    const blockState = blockDefinitionToBlockState(block);
    createUsedVariables(blockState);

    return blockState;
}