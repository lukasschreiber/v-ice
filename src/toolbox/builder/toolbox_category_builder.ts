import { IsHiddenFunc, IToolboxCategoryDefinition } from "./definitions";

export abstract class ToolboxCategoryBuilder<T extends IToolboxCategoryDefinition> {
    protected isHidden?: IsHiddenFunc = false;
    protected name: string = "";
    protected style: string = "";
    protected id: string;

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

    abstract build(): T
}