import * as Blockly from "blockly/core"
import { store } from "@/store/store";
import { Blocks } from "@/blocks";

export class Nodes {
    static CATEGORY_NAME = 'NODES';

    static flyoutCategory(): Blockly.utils.toolbox.FlyoutItemInfo[] {
        // option to add buttons etc to the array
        return Nodes.flyoutCategoryBlocks();
    }

    static flyoutCategoryBlocks(): Blockly.utils.toolbox.FlyoutItemInfo[] {
        const flyoutInfoList: Blockly.utils.toolbox.FlyoutItemInfo[] = []

        flyoutInfoList.push({
            kind: "block",
            type: Blocks.Names.NODE.SOURCE,
            gap: "24"
        })

        flyoutInfoList.push({
            kind: "block",
            type: Blocks.Names.NODE.SUBSET,
            gap: "24"
        })

        flyoutInfoList.push({
            kind: "block",
            type: Blocks.Names.NODE.SET_ARITHMETIC,
            gap: "24"
        })

        const targetBlocks = store.getState().blockly.targetBlocks
        for(const [uid, name] of Object.entries(targetBlocks)) {
            flyoutInfoList.push({
                kind: "block",
                type: Blocks.Names.NODE.TARGET,
                gap: "24",
                fields: {
                    LABEL: {
                        name,
                        id: uid
                    },
                }
            })
        }


        return flyoutInfoList;
    }
}