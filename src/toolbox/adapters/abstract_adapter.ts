import { GenericBlockDefinition, IDynamicToolboxCategory, IStaticToolboxCategory, ToolboxCategoryMetadata, ToolboxDefinition } from "../builder/definitions";
import { DynamicToolboxCategory } from "../categories/dynamic_category";

export abstract class AbstractToolboxAdapter<T, D, S, B> {
    constructor(protected toolbox: ToolboxDefinition) { }

    abstract toToolboxDefinition(): T
    
    abstract dynamicCategoryAdapter<C extends DynamicToolboxCategory>(category: IDynamicToolboxCategory<C, ToolboxCategoryMetadata>): D;

    abstract staticCategoryAdapter(category: IStaticToolboxCategory<ToolboxCategoryMetadata>): S;

    abstract blockAdapter(block: GenericBlockDefinition): B;
}