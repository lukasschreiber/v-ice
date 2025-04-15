import { IsHiddenFunc, IToolboxCategoryDefinition, ToolboxCategoryMetadata } from "./definitions";

export abstract class ToolboxCategoryBuilder<T extends IToolboxCategoryDefinition<M>, M extends ToolboxCategoryMetadata> {
    protected isHidden?: IsHiddenFunc = false;
    protected name: string = "";
    protected style: string = "";
    protected id: string;
    protected metadata?: M;

    constructor(id: string, name: string, style: string) {
        this.name = name;
        this.style = style;
        this.id = id;
    }

    withCondition(condition: IsHiddenFunc) {
        this.isHidden = condition;
        return this;
    }

    withName(name: string) {
        this.name = name;
        return this;
    }

    withStyle(style: string) {
        this.style = style;
        return this;
    }

    withMetadata(metadata: M) {
        this.metadata = metadata;
        return this;
    }

    abstract build(): T
}