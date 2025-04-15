import { DynamicToolboxCategory } from "../categories/dynamic_category";
import { IDynamicToolboxCategory } from "./definitions";
import { ToolboxCategoryBuilder } from "./toolbox_category_builder";

export class DynamicToolboxCategoryBuilder<T extends DynamicToolboxCategory> extends ToolboxCategoryBuilder<IDynamicToolboxCategory<T>> {
    private instance: T | null = null;

    constructor(name: string, style: string) {
        super(name, style);
    }

    withInstance(instance: (new () => T)) {
        this.instance = new instance();
        return this;
    }

    override build(): IDynamicToolboxCategory<T> {
        if (this.instance === null) {
            throw new Error("DynamicToolboxCategoryBuilder: instance is not set");
        }

        return {
            kind: "dynamic",
            instance: this.instance,
            isHidden: this.isHidden,
            name: this.name,
            style: this.style
        }
    }
}