import { DynamicToolboxCategory } from "../categories/dynamic_category";
import { IDynamicToolboxCategory, ToolboxCategoryMetadata } from "./definitions";
import { ToolboxCategoryBuilder } from "./toolbox_category_builder";

export class DynamicToolboxCategoryBuilder<T extends DynamicToolboxCategory, M extends ToolboxCategoryMetadata> extends ToolboxCategoryBuilder<IDynamicToolboxCategory<T, M>, M> {
    private instance: T | null = null;

    constructor(id: string, name: string, style: string) {
        super(id, name, style);
    }

    withInstance(instance: (new () => T)) {
        this.instance = new instance();
        return this;
    }

    override build(): IDynamicToolboxCategory<T, M> {
        if (this.instance === null) {
            throw new Error("DynamicToolboxCategoryBuilder: instance is not set");
        }

        return {
            id: this.id,
            kind: "dynamic",
            instance: this.instance,
            isHidden: this.isHidden,
            name: this.name,
            style: this.style,
            metadata: this.metadata
        }
    }
}