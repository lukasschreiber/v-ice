import { AnyRegistrableBlock, BlockLinesDefinition } from "@/blocks/block_definitions";
import { NormalizedDataTable } from "@/data/table";
import { IType, ValueOf } from "@/main";
import * as Blockly from "blockly/core";
import { DynamicToolboxCategory } from "../categories/dynamic_category";

export type DataTableStructure = NormalizedDataTable["columns"]

export type ToolboxDefinition = (IDynamicToolboxCategory<DynamicToolboxCategory, ToolboxCategoryMetadata> | IStaticToolboxCategory<ToolboxCategoryMetadata>)[]

export type IsHiddenFunc = ((workspace: Blockly.Workspace, tableStructure: DataTableStructure) => boolean) | (() => boolean) | boolean

export type ToolboxCategoryMetadata = { [key: string]: unknown } | undefined

export interface IToolboxCategoryDefinition<M extends ToolboxCategoryMetadata> {
    id: string
    kind: "static" | "dynamic"
    name: string
    style: string
    isHidden?: IsHiddenFunc
    metadata?: M
}

export interface IDynamicToolboxCategory<T extends DynamicToolboxCategory, M extends ToolboxCategoryMetadata> extends IToolboxCategoryDefinition<M> {
    kind: "dynamic"
    instance: T
}

export interface IStaticToolboxCategory<M extends ToolboxCategoryMetadata> extends IToolboxCategoryDefinition<M> {
    kind: "static"
    blocks: GenericBlockDefinition[]
}

export interface AbstractToolboxBlockDefinition {
    type: string
    isHidden?: IsHiddenFunc
}

export interface BlockConnectionDefinition {
    shadow?: GenericBlockDefinition,
    block?: GenericBlockDefinition
}

export interface GenericBlockDefinition extends AbstractToolboxBlockDefinition {
    fields?: { [key: string]: { value: string | number | boolean | null, [key: string]: unknown } }
    inputs?: { [key: string]: BlockConnectionDefinition }
    extraState?: { [key: string]: unknown }
    next?: BlockConnectionDefinition
}

export interface IBlockDefinition<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> extends AbstractToolboxBlockDefinition {
    type: T["id"]
    fields?: Merge<ExtractFields<L, T>>
    inputs?: Merge<ExtractInputs<L, T>>
}

type ExtractFields<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> =
    T["lines"] extends Array<{ args: Array<infer U> }> 
    ? U extends { type: `field_${string}`, name: string, check?: IType }
    ? { [K in U['name']]: {
        value?: U['check'] extends IType ? ValueOf<U['check']> : string | number | boolean | null,
        [key: string]: unknown
    } }
    : undefined
    : undefined;

type ExtractInputs<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>>= 
    T["lines"] extends Array<{ args: Array<infer U> }> 
    ? U extends { type: `input_${string}`, name: string } 
    ? { [K in U['name']]: {
        shadow?: GenericBlockDefinition,
        block?: GenericBlockDefinition
    } } 
    : undefined 
    : undefined;

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

export type BlockFields<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> = Merge<ExtractFields<L, T>>
export type BlockInputs<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> = Merge<ExtractInputs<L, T>>