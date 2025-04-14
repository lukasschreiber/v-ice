import { ColumnSelectBlock, VariableBlock } from "@/blocks/definitions/variables";
import { buildBlock } from "../builder";
import { GenericBlockDefinition } from "../builder/definitions";
import { DynamicToolboxCategory } from "./dynamic_category";
import * as Blockly from "blockly/core"

export class Variables extends DynamicToolboxCategory {
    getBlocks(workspace: Blockly.Workspace): GenericBlockDefinition[] {
        const variableModelList = workspace.getAllVariables();

        const variableBlocks: GenericBlockDefinition[] = [];

        if (variableModelList.length > 0) {
            variableModelList.sort(Blockly.VariableModel.compareByName);
            for (let i = 0, variable; (variable = variableModelList[i]); i++) {
                variableBlocks.push(buildBlock(VariableBlock).withFields({
                    VAR: {
                        id: variable.getId(),
                        name: variable.name,
                        type: variable.type
                    }
                }).build())
            }
        }

        variableBlocks.push(buildBlock(ColumnSelectBlock).build())

        return variableBlocks;
    }
}