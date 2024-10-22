import * as Blockly from 'blockly/core';
import { BlockDefinitions } from '@/blocks/definitions';
import { BlockDefinitionJson } from '../block_definitions';
import { IType, ValueOf } from '@/data/types';
import { SerializedTable } from '@/data/table';

export function defineToolbox(toolbox: ToolboxDefinition): Blockly.utils.toolbox.ToolboxDefinition {
    return {
        kind: "categoryToolbox",
        contents: toolbox.map(categoryDefinitionToCategory)
    }
}

export function defineCategory(name: string, style: string): ICategoryDefinitionFactory {
    return {
        name,
        style,
        withBlocks(blocks) {
            return {
                ...this,
                name,
                style,
                blocks,
                withCondition(condition: IsHiddenFunc) {
                    return {
                        ...this,
                        isHidden: condition,
                    }
                }
            }
        },
        asDynamicCategory(categoryClass) {
            return {
                ...this,
                name,
                style,
                custom: categoryClass.CATEGORY_NAME,
                register(workspace: Blockly.WorkspaceSvg) {
                    workspace.registerToolboxCategoryCallback(categoryClass.CATEGORY_NAME, categoryClass.flyoutCategory.bind(categoryClass))
                },
                withCondition(condition: IsHiddenFunc) {
                    return {
                        ...this,
                        isHidden: condition
                    }
                }
            }
        },
        withCondition(condition: IsHiddenFunc) {
            return {
                ...this,
                isHidden: condition,
            }
        }
    }
}

export function defineBlock<Id extends keyof typeof BlockDefinitions>(id: Id): IBlockDefinitionFactory<Id> {
    return {
        type: id,
        withFields(fields: Merge<ExtractFields<ExtractById<typeof BlockDefinitions, Id>>>): IBlockDefinitionFactory<Id> {
            return {
                ...this,
                fields
            }
        },
        withInputs(inputs: Merge<ExtractInputs<ExtractById<typeof BlockDefinitions, Id>>>): IBlockDefinitionFactory<Id> {
            return {
                ...this,
                inputs
            }
        },
        withCondition(condition: IsHiddenFunc): IBlockDefinitionFactory<Id> {
            return {
                ...this,
                isHidden: condition,
            }
        }
    }
}

// TODO: narrow down T
export function hasIsHiddenFunc<T>(item: T): item is T & { isHidden: IsHiddenFunc } {
    return Object.prototype.hasOwnProperty.call(item, "isHidden")
}

// TODO: narrow down T
export function evaluateIsHiddenFunc<T>(item: T, workspace: Blockly.Workspace, table: SerializedTable): boolean {
    if (hasIsHiddenFunc(item)) {
        if (typeof item.isHidden === "function") {
            return item.isHidden(workspace, table)
        } else {
            return item.isHidden
        }
    }

    return false
}

// TODO: narrow down T
function hasRegisterFunc<T>(item: T): item is T & { register: (workspace: Blockly.WorkspaceSvg) => void } {
    return Object.prototype.hasOwnProperty.call(item, "register")
}

export function registerCategory<T>(item: T, workspace: Blockly.WorkspaceSvg) {
    if (hasRegisterFunc(item)) {
        item.register(workspace)
    }
}

export function blockToBlockDefinition(block: Blockly.serialization.blocks.State | Blockly.Block): GenericBlockDefinition {
    if (block instanceof Blockly.Block) {
        return blockToBlockDefinition(Blockly.serialization.blocks.save(block)!)
    }

    const inputs: { [key: string]: BlockConnectionDefinition } | undefined = block.inputs ? Object.entries(block.inputs).map(([name, input]) => {
        return {
            [name]: {
                shadow: input.shadow ? blockToBlockDefinition(input.shadow) : undefined,
                block: input.block ? blockToBlockDefinition(input.block) : undefined
            }
        }
    }).reduce((acc, input) => {
        return {
            ...acc,
            ...input
        }
    }, {}) : undefined

    const fields = block.fields
        ? Object.entries(block.fields).reduce((acc, [name, field]) => {
            if (typeof field === "string") {
                acc[name] = { value: field };
            } else {
                acc[name] = field;
            }
            return acc;
        }, {} as { [key: string]: { value: string | number | boolean | null, [key: string]: unknown } })
        : undefined;

    return {
        type: block.type as keyof typeof BlockDefinitions,
        fields,
        inputs,
        extraState: block.extraState,
        next: block.next ? {
            shadow: block.next.shadow ? blockToBlockDefinition(block.next.shadow) : undefined,
            block: block.next.block ? blockToBlockDefinition(block.next.block) : undefined
        } : undefined
    }
}

export function blockDefinitionToBlock(block: GenericBlockDefinition): Blockly.serialization.blocks.State {
    const inputs: { [key: string]: Blockly.serialization.blocks.ConnectionState } | undefined = block.inputs ? Object.entries(block.inputs).map(([name, input]) => {
        return {
            [name]: {
                shadow: input.shadow ? blockDefinitionToBlock(input.shadow) as Blockly.serialization.blocks.State : undefined,
                block: input.block ? blockDefinitionToBlock(input.block) as Blockly.serialization.blocks.State : undefined
            }
        }
    }).reduce((acc, input) => {
        return {
            ...acc,
            ...input
        }
    }, {}) : undefined

    const fields = block.fields
        ? Object.entries(block.fields).reduce((acc, [name, field]) => {
            acc[name] = Object.keys(field).length === 1 ? field.value : { ...field, value: field.value };
            return acc;
        }, {} as { [key: string]: string | number | boolean | null | { [key: string]: unknown } })
        : undefined;

    return {
        type: block.type,
        fields,
        inputs,
        extraState: block.extraState,
        next: block.next ? {
            shadow: block.next.shadow ? blockDefinitionToBlock(block.next.shadow) : undefined,
            block: block.next.block ? blockDefinitionToBlock(block.next.block) : undefined
        } : undefined
    }
}

function blockDefinitionToToolboxItem(block: GenericBlockDefinition): Blockly.utils.toolbox.ToolboxItemInfo & { isHidden: IsHiddenFunc } {
    const inputs: { [key: string]: Blockly.serialization.blocks.ConnectionState } | undefined = block.inputs ? Object.entries(block.inputs).map(([name, input]) => {
        return {
            [name]: {
                shadow: input.shadow ? blockDefinitionToToolboxItem(input.shadow) as Blockly.serialization.blocks.State : undefined,
                block: input.block ? blockDefinitionToToolboxItem(input.block) as Blockly.serialization.blocks.State : undefined
            }
        }
    }).reduce((acc, input) => {
        return {
            ...acc,
            ...input
        }
    }, {}) : undefined

    const fields = block.fields
        ? Object.entries(block.fields).reduce((acc, [name, field]) => {
            acc[name] = Object.keys(field).length === 1 ? field.value : { ...field, value: field.value };
            return acc;
        }, {} as { [key: string]: string | number | boolean | null | { [key: string]: unknown } })
        : undefined;

    return {
        kind: "block",
        type: block.type,
        fields,
        inputs,
        isHidden: block.isHidden || false
    }

}

function categoryDefinitionToCategory(category: IDynamicCategory | IBlockCategory): Blockly.utils.toolbox.ToolboxItemInfo & { isHidden: IsHiddenFunc, register?: (workspace: Blockly.WorkspaceSvg) => void} {
    if (Object.prototype.hasOwnProperty.call(category, "blocks")) {
        return {
            kind: "category",
            name: category.name,
            categorystyle: category.style,
            isHidden: category.isHidden ?? false,
            contents: (category as IBlockCategory).blocks.map(blockDefinitionToToolboxItem)
        }
    } else if (Object.prototype.hasOwnProperty.call(category, "custom") && hasRegisterFunc(category)) {
        return {
            kind: "category",
            name: category.name,
            categorystyle: category.style,
            isHidden: category.isHidden ?? false,
            custom: (category as IDynamicCategory).custom,
            register: category.register
        }
    }

    return {
        kind: "category",
        name: category.name,
        categorystyle: category.style,
        isHidden: category.isHidden ?? false,
        contents: []
    }
}


type ToolboxDefinition = (IDynamicCategory | IBlockCategory)[]

export type IsHiddenFunc = ((workspace: Blockly.Workspace, table: SerializedTable) => boolean) | (() => boolean) | boolean

interface IToolboxCategoryDefinition {
    name: string
    style: string
    isHidden?: IsHiddenFunc
}

interface IDynamicCategory extends IToolboxCategoryDefinition {
    custom: string
}

interface IBlockCategory extends IToolboxCategoryDefinition {
    blocks: GenericBlockDefinition[]
}

export interface AbstractBlockDefinition {
    type: keyof typeof BlockDefinitions
    isHidden?: IsHiddenFunc
}

export interface BlockConnectionDefinition {
    shadow?: GenericBlockDefinition, 
    block?: GenericBlockDefinition
}

export interface GenericBlockDefinition extends AbstractBlockDefinition {
    fields?: { [key: string]: { value: string | number | boolean | null, [key: string]: unknown } }
    inputs?: { [key: string]: BlockConnectionDefinition }
    extraState?: { [key: string]: unknown }
    next?: BlockConnectionDefinition
}

export interface IBlockDefinition<T extends keyof typeof BlockDefinitions> extends AbstractBlockDefinition {
    type: T
    fields?: Merge<ExtractFields<ExtractById<typeof BlockDefinitions, T>>>
    inputs?: Merge<ExtractInputs<ExtractById<typeof BlockDefinitions, T>>>
}

// TODO: The semantics of withCondition should be switched to reflect isShown instead of isHidden

interface IBlockDefinitionFactory<T extends keyof typeof BlockDefinitions> extends IBlockDefinition<T> {
    withFields(fields: Merge<ExtractFields<ExtractById<typeof BlockDefinitions, T>>>): IBlockDefinitionFactory<T>
    withInputs(inputs: Merge<ExtractInputs<ExtractById<typeof BlockDefinitions, T>>>): IBlockDefinitionFactory<T>
    withCondition(condition: IsHiddenFunc): IBlockDefinitionFactory<T>
}

interface ICategoryDefinitionFactory extends IToolboxCategoryDefinition {
    withBlocks(blocks: GenericBlockDefinition[]): IBlockCategoryFactory
    asDynamicCategory(categoryClass: { new(...args: unknown[]): unknown; CATEGORY_NAME: string, flyoutCategory: ((workspace: Blockly.WorkspaceSvg) => Blockly.utils.toolbox.ToolboxItemInfo[]) }): IDynamicCategoryFactory
    withCondition(condition: IsHiddenFunc): ICategoryDefinitionFactory
}

interface IDynamicCategoryFactory extends IDynamicCategory {
    withCondition(condition: IsHiddenFunc): IDynamicCategory
    register(workspace: Blockly.WorkspaceSvg): void
}

interface IBlockCategoryFactory extends IBlockCategory {
    withCondition(condition: IsHiddenFunc): IBlockCategory
}

type ExtractById<T, Id extends keyof T> = Id extends string ? ExtractFromUnion<T[Id], Id> : never
type ExtractFromUnion<T, Id extends string> = T extends { id: Id } ? T : never

type ExtractFields<T extends BlockDefinitionJson> = {
    [Key in keyof T]: T[Key] extends Array<infer U>
    ? U extends { type: `field_${string}`, name: string, check?: IType }
    ? { [K in U['name']]: {
        value: U['check'] extends IType ? ValueOf<U['check']> : string | number | boolean | null,
        [key: string]: unknown
    } }
    : undefined
    : undefined;
}[keyof T];

type ExtractInputs<T extends BlockDefinitionJson> = {
    [Key in keyof T]: T[Key] extends Array<infer U>
    ? U extends { type: `input_${string}`, name: string }
    ? { [K in U['name']]: {
        shadow?: GenericBlockDefinition,
        block?: GenericBlockDefinition
    } }
    : undefined
    : undefined;
}[keyof T];

// This is copied from https://dev.to/lucianbc/union-type-merging-in-typescript-9al
// We do not use the merge type from there but we modified it to FixTooltip to correctly show the tooltip in the editor

type PickType<T, K extends keyof T> = T extends { [k in K]?: unknown }
    ? T[K]
    : undefined;

type PickTypeOf<T, K extends string | number | symbol> = K extends keyof T
    ? PickType<T, K>
    : never;

type FixTooltip<T extends object | undefined> = T extends object ? {
    [k in keyof T]: PickTypeOf<T, k>;
} : undefined

type Merge<T> = FixTooltip<Partial<{
    [K in T extends object ? keyof T : never]: T extends { [k in K]: infer U } ? U : never
}>>;