import { VariableBlock } from "@/blocks/definitions/variables";
import { buildBlock } from "../builder";
import { GenericBlockDefinition } from "../builder/definitions";
import { DynamicToolboxCategory } from "./dynamic_category";
import * as Blockly from "blockly/core";
import { store } from "@/store/store";
import { getToolboxBlockId } from "@/utils/ids";

export class FavoriteBlocks extends DynamicToolboxCategory {
    private blockHashMap: Map<string, string> = new Map();

    getBlocks(workspace: Blockly.Workspace): GenericBlockDefinition[] {
        const pinnedBlocks = store.getState().blockly.pinnedBlocks;

        const variableModelList = workspace.getAllVariables();

        const variableBlocks: GenericBlockDefinition[] = [];

        if (variableModelList.length > 0) {
            variableModelList.sort(Blockly.VariableModel.compareByName);
            for (let i = 0, variable; (variable = variableModelList[i]); i++) {
                const block = buildBlock(VariableBlock).withFields({
                    VAR: {
                        id: variable.getId(),
                        name: variable.name,
                        type: variable.type
                    }
                }).build()

                if (pinnedBlocks.find(item => item.hash === getToolboxBlockId(block)) === undefined) {
                    continue;
                }
                variableBlocks.push(block)
            }
        }

        return variableBlocks;
    }
}