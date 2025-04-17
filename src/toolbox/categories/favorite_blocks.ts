import { GenericBlockDefinition } from "../builder/definitions";
import { DynamicToolboxCategory } from "./dynamic_category";
import { store } from "@/store/store";
import { Blocks } from "@/blocks";

export class FavoriteBlocks extends DynamicToolboxCategory {
    getBlocks(): GenericBlockDefinition[] {
        const pinnedBlocks = store.getState().blockly.pinnedBlocks;
        return pinnedBlocks.filter(block => block.block.type !== Blocks.Names.VARIABLE.GET).map(block => block.block);
    }
}