import { DynamicToolboxCategory } from "../categories/dynamic_category";
import { IDynamicToolboxCategory, IStaticToolboxCategory, ToolboxDefinition } from "./definitions";

export class ToolboxBuilder {
    readonly categories: ToolboxDefinition;

    constructor() {
        this.categories = [];
    }
    
    addStaticCategory(category: IStaticToolboxCategory) {
        this.categories.push(category);
        return this;
    }

    addDynamicCategory<T extends DynamicToolboxCategory>(category: IDynamicToolboxCategory<T>) {
        this.categories.push(category);
        return this;
    }

    build() {
        return this.categories;
    }
}