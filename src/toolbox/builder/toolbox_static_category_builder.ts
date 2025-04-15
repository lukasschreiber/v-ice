import { GenericBlockDefinition, IStaticToolboxCategory, ToolboxCategoryMetadata } from "./definitions";
import { ToolboxCategoryBuilder } from "./toolbox_category_builder";

export class StaticToolboxCategoryBuilder<M extends ToolboxCategoryMetadata> extends ToolboxCategoryBuilder<IStaticToolboxCategory<M>, M> {
    blocks: GenericBlockDefinition[] = [];

    constructor(id: string, name: string, style: string) {
        super(id, name, style);
    }

    addBlock(block: GenericBlockDefinition) {
        this.blocks.push(block);
        return this;
    }

    withBlocks(blocks: GenericBlockDefinition[]) {
        this.blocks = blocks;
        return this;
    }

    build(): IStaticToolboxCategory<M> {
        return {
            id: this.id,
            kind: "static",
            name: this.name,
            style: this.style,
            blocks: this.blocks,
            isHidden: this.isHidden,
            metadata: this.metadata
        }
    }
}