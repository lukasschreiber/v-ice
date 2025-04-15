import { GenericBlockDefinition, IStaticToolboxCategory } from "./definitions";
import { ToolboxCategoryBuilder } from "./toolbox_category_builder";

export class StaticToolboxCategoryBuilder extends ToolboxCategoryBuilder<IStaticToolboxCategory> {
    blocks: GenericBlockDefinition[] = [];

    constructor(name: string, style: string) {
        super(name, style);
    }

    addBlock(block: GenericBlockDefinition) {
        this.blocks.push(block);
        return this;
    }

    withBlocks(blocks: GenericBlockDefinition[]) {
        this.blocks = blocks;
        return this;
    }

    build(): IStaticToolboxCategory {
        return {
            kind: "static",
            name: this.name,
            style: this.style,
            blocks: this.blocks,
            isHidden: this.isHidden
        }
    }
}