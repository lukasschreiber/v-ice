import { DynamicToolboxCategory } from "../categories/dynamic_category";
import { IDynamicToolboxCategory, IStaticToolboxCategory, ToolboxCategoryMetadata, ToolboxDefinition } from "./definitions";

export class ToolboxBuilder {
    readonly categories: ToolboxDefinition;

    constructor() {
        this.categories = [];
    }
    
    addStaticCategory(category: IStaticToolboxCategory<ToolboxCategoryMetadata>) {
        this.categories.push(category);
        return this;
    }

    addDynamicCategory<T extends DynamicToolboxCategory>(category: IDynamicToolboxCategory<T, ToolboxCategoryMetadata>) {
        this.categories.push(category);
        return this;
    }

    build() {
        return this.categories;
    }
}