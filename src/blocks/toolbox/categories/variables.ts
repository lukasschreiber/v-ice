import * as Blockly from "blockly/core"
import { Blocks } from "@/blocks";

export class Variables {
    static CATEGORY_NAME = 'COMPUTED_VARIABLES';

    static flyoutCategory(workspace: Blockly.WorkspaceSvg): Blockly.utils.toolbox.FlyoutItemInfo[] {
        // option to add buttons etc to the array
        return Variables.flyoutCategoryBlocks(workspace);
    }

    static flyoutCategoryBlocks(workspace: Blockly.Workspace): Blockly.utils.toolbox.FlyoutItemInfo[] {
        const variableModelList = workspace.getAllVariables();
        const flyoutInfoList: Blockly.utils.toolbox.FlyoutItemInfo[] = []
        if (variableModelList.length > 0) {
            variableModelList.sort(Blockly.VariableModel.compareByName);
            for (let i = 0, variable; (variable = variableModelList[i]); i++) {
                flyoutInfoList.push(Variables.getTypedBlockFlyoutInfo(variable))
            }
        }

        flyoutInfoList.push({
            kind: "block",
            type: Blocks.Names.VARIABLE.GET_COLUMN,
            gap: "24",
            fields: {}
        })

        return flyoutInfoList;
    }

    static getTypedBlockFlyoutInfo(variable: Blockly.VariableModel): Blockly.utils.toolbox.FlyoutItemInfo {
        const flyoutItemInfo: Blockly.utils.toolbox.FlyoutItemInfo = {
            kind: "block",
            type: Blocks.Names.VARIABLE.GET,
            gap: "24",
            fields: {
                VAR: {
                    id: variable.getId(),
                    name: variable.name,
                    type: variable.type
                }
            }
        }
        
        return flyoutItemInfo
    }

}