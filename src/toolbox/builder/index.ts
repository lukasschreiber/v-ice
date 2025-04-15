import { AnyRegistrableBlock, BlockLinesDefinition } from "@/blocks/block_definitions";
import { ToolboxBlockBuilder } from "./toolbox_block_builder";
import { StaticToolboxCategoryBuilder } from "./toolbox_static_category_builder";
import { DynamicToolboxCategoryBuilder } from "./toolbox_dynamic_category_builder";
import { ToolboxBuilder } from "./toolbox_builder";
import * as Blockly from "blockly/core";

export function buildBlock<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>>(block: T) {
    return new ToolboxBlockBuilder<L, T>(block);
}

export function buildStaticCategory(name: string, style: string) {
    return new StaticToolboxCategoryBuilder(Blockly.utils.idGenerator.genUid(), name, style);
}

export function buildDynamicCategory( name: string, style: string) {
    return new DynamicToolboxCategoryBuilder(Blockly.utils.idGenerator.genUid(), name, style);
}

export function buildToolbox() {
    return new ToolboxBuilder();
}