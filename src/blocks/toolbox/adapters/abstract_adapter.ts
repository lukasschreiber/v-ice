import { GenericBlockDefinition, IDynamicToolboxCategory, IStaticToolboxCategory, ToolboxDefinition } from "../builder/definitions";
import { DynamicToolboxCategory } from "../categories/dynamic_category";

export abstract class AbstractToolboxAdapter<T, D, S, B> {
    constructor(protected toolbox: ToolboxDefinition) { }

    toToolboxDefinition(): T {
        // TODO: Move kind and contents to the concrete adapter
        return {
            kind: "categoryToolbox",
            contents: this.toolbox.map(category => {
                if (category.kind === "dynamic") {
                    return this.dynamicCategoryAdapter(category);
                } else {
                    return this.staticCategoryAdapter(category);
                }
            })
        } as unknown as T;
    }

    abstract dynamicCategoryAdapter<C extends DynamicToolboxCategory>(category: IDynamicToolboxCategory<C>): D;

    abstract staticCategoryAdapter(category: IStaticToolboxCategory): S;

    abstract blockAdapter(block: GenericBlockDefinition): B;
}