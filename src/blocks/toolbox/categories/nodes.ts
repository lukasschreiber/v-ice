import { buildBlock } from "../builder";
import { GenericBlockDefinition } from "../builder/definitions";
import { DynamicToolboxCategory } from "./dynamic_category";
import { SetArithmeticNodeBlock, SourceNodeBlock, SubsetNodeBlock, TargetNodeBlock } from "@/blocks/definitions/nodes";
import { store } from "@/store/store";

export class Nodes extends DynamicToolboxCategory {
    getBlocks(): GenericBlockDefinition[] {
        const nodeBlocks: GenericBlockDefinition[] = [];

        nodeBlocks.push(buildBlock(SourceNodeBlock).build())
        nodeBlocks.push(buildBlock(SubsetNodeBlock).build())
        nodeBlocks.push(buildBlock(SetArithmeticNodeBlock).build())

        const targetBlocks = store.getState().blockly.targetBlocks
        for (const [uid, name] of Object.entries(targetBlocks)) {
            nodeBlocks.push(
                buildBlock(TargetNodeBlock).withFields({
                    LABEL: {
                        name,
                        id: uid
                    }
                }).build()
            )
        }

        return nodeBlocks;
    }
}