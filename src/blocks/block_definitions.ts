import { IType } from "@/data/types"
import * as Blockly from "blockly/core"
import { BlockExtension, ExtensionMixins, RegistrableExtension } from "@/blocks/block_extensions"
import { MutatorMixin, RegistrableMutator } from "./block_mutators"
import { BlockQueryGenerator, NodeBlockQueryGenerator, QueryGenerator } from "@/query/builder/query_generator"
import { QueryNode, QueryOperation } from "@/query/builder/query_tree"
import { NodeBlock, NodeBlockExtension } from "./extensions/node"
import { getQueryGeneratorInstance } from "@/query/builder/query_generator_instance"

// This is needed because currently blockly defines BlockDefinition as any, see this Github Issue:
// https://github.com/google/blockly/issues/6828
// All functions of Block need to be called with ! because they always exist although typescript does not know that
export type BlocklyBlockDefinition = { [Property in keyof Blockly.Block]?: Blockly.Block[Property] } & { [key: string]: unknown }

export function registerBlock<Es extends RegistrableExtension[], M extends RegistrableMutator, L extends BlockLinesDefinition, T extends RegistrableBlock<Es, M, L>>(block: T): void {
    const definition = convertBlockDefinitionToBlocklyJson<Es, M, L, T>(block)
    if (definition.output && typeof definition.output !== "string") definition.output = definition.output.name
    for (const key in definition) {
        if (key.startsWith("args")) {
            for (const arg of definition[key as keyof BlocklyJsonBlockDefinition] as (FieldDefinition | InputDefinition)[]) {
                if (arg.check && typeof arg.check !== "string") {
                    arg.check = (arg.check as IType).name
                }
            }
        }
    }
    const blockDefinition: BlocklyBlockDefinition = {
        init: function () {
            this.jsonInit!(definition)
            if (definition.data) {
                this.data = JSON.stringify(definition.data)
            }
        },
    }

    Blockly.Blocks[definition.id] = blockDefinition
}

export enum ConnectionType {
    BOOLEAN = "Boolean",
    TIMELINE_PROTOTYPE = "TimelinePrototype",
}

// export function registerBlocks<T extends Array<RegistrableBlock<never[], never> & { id: string }>>(blocks: T): Readonly<Record<T[number]["id"], T[number]>> {
//     for (const definition of blocks) {

// }

function convertBlockDefinitionToBlocklyJson<Es extends RegistrableExtension[], M extends RegistrableMutator, L extends BlockLinesDefinition, T extends RegistrableBlock<Es, M, L>>(block: T): BlocklyJsonBlockDefinition {

    const extensions: string[] = []
    let mutatorName: string | undefined = undefined

    for (const extension of block.extensions ?? []) {
        const ext = getExtensionInstance(extension)
        if (!Blockly.Extensions.isRegistered(ext.name)) {
            ext.register()
        }
        extensions.push(ext.name)
    }

    if (block.mutator) {
        const mutator = getExtensionInstance(block.mutator)
        if (!Blockly.Extensions.isRegistered(mutator.name)) {
            mutator.register()
        }
        mutatorName = mutator.name
    }

    if (block.code) {
        // TODO this could probably have nicer types but at the moment it's not worth the effort

        if (extensions.includes(getExtensionInstance(NodeBlockExtension).name)) {
            getQueryGeneratorInstance().registerNode(block.id, block, block.code as (...args: any[]) => QueryNode)
        } else {
            getQueryGeneratorInstance().registerOperation(block.id, block, block.code as (...args: any[]) => QueryOperation)
        }
    }

    const result: BlocklyJsonBlockDefinition = {
        data: block.data,
        style: block.style,
        helpUrl: block.helpUrl,
        tooltip: block.tooltip,
        inputsInline: block.inputsInline,
        output: block.output,
        extensions: extensions,
        mutator: mutatorName,
        id: block.id!,
        previousStatement: block.connectionType !== undefined ? block.connectionType : block.previousStatement,
        nextStatement: block.connectionType !== undefined ? block.connectionType : block.nextStatement,
        colour: block.color,
    }

    if (block.lines) {
        for (let i = 0; i < block.lines.length; i++) {
            const line = block.lines[i]
            result[`message${i}`] = line.text
            result[`args${i}`] = line.args
            if (line.align) result[`implicitAlign${i}`] = line.align
        }
    }

    return result
}

const extensionInstances: Record<string, BlockExtension<any>> = {}

function getExtensionInstance<T extends BlockExtension<any>>(extension: new (...args: any[]) => T): T {
    const constructorName = extension.name
    if (!extensionInstances[constructorName]) {
        extensionInstances[constructorName] = new extension()
    }
    return extensionInstances[constructorName] as T
}

type BlocklyJsonBlockDefinition = {
    [key: `message${number}`]: string
    [key: `args${number}`]: (FieldDefinition | InputDefinition)[]
    [key: `implicitAlign${number}`]: "RIGHT" | "CENTRE" | "LEFT"
    colour?: number | string
    nextStatement?: null | string | string[]
    previousStatement?: null | string | string[]
    output?: IType | string
    inputsInline?: boolean
    tooltip?: string
    style?: string
    helpUrl?: string
    mutator?: string
    extensions?: string[]
    id: string
    data?: object | string
}

export interface BlockLineDefinition {
    text: string
    args: (FieldDefinition | InputDefinition)[]
    align?: "RIGHT" | "CENTRE" | "LEFT"
}

export type BlockLinesDefinition = BlockLineDefinition[]

export interface RegistrableBlock<
    Es extends RegistrableExtension[],
    M extends RegistrableMutator,
    L extends BlockLinesDefinition,
> {
    id: string
    color?: number | string
    helpUrl?: string
    lines: L
    nextStatement?: null | string | string[]
    previousStatement?: null | string | string[]
    connectionType?: string
    output?: IType | string
    inputsInline?: boolean
    tooltip?: string
    style?: string
    mutator?: M
    extensions?: Es
    data?: object | string
    code?: (
        scope: NotNever<ExtensionsMatch<Es, typeof NodeBlockExtension>> extends true ? NodeBlockQueryGenerator<L, AnyRegistrableBlock<L>, NodeBlock & ExtensionMixins<Es> & MutatorMixin<M>> : BlockQueryGenerator<L, AnyRegistrableBlock<L>, Blockly.Block & ExtensionMixins<Es> & MutatorMixin<M>>,
        generator: QueryGenerator
    ) => NotNever<ExtensionsMatch<Es, typeof NodeBlockExtension>> extends true ? QueryNode : QueryOperation
}

export type FieldDefinition = {
    type: `field_${string}`
    name: string
    [key: string]: unknown
}

export type InputDefinition = {
    type: `input_${string}`
    name: string
    check?: IType | string
}

export function createBlock<
    Es extends RegistrableExtension[] = never[],
    M extends RegistrableMutator = never,
    L extends BlockLinesDefinition = never,
>(definition: RegistrableBlock<Es, M, L>): RegistrableBlock<Es, M, L> {
    registerBlock<Es, M, L, RegistrableBlock<Es, M, L>>(definition)
    return definition
}

type ExtensionsMatch<T, U> = T extends (infer R)[] ? R extends U ? true : false : false
type NotNever<T> = [T] extends [never] ? false : true;


export type AnyRegistrableBlock<L extends BlockLinesDefinition> = RegistrableBlock<any[], any, L> | RegistrableBlock<never[], never, L> | RegistrableBlock<any[], never, L> | RegistrableBlock<never[], any, L>

export type BlockFieldNames<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> =
    T["lines"] extends Array<{ args: Array<infer U> }>
    ? U extends { type: `field_${string}`, name: string }
    ? U["name"]
    : never
    : never;

export type BlockInputNames<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> =
    T["lines"] extends Array<{ args: Array<infer U> }>
    ? U extends { type: `input_${string}`, name: string }
    ? U["name"]
    : never
    : never;

export type BlockFieldByType<
    L extends BlockLinesDefinition,
    T extends AnyRegistrableBlock<L>,
    FieldType extends string // The specific type to filter
> = T["lines"] extends Array<{ args: Array<infer U> }>
    ? U extends { type: `${FieldType}`, name: string }
    ? U["name"]
    : never
    : never;

export type ConnectionPointNames<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> = BlockFieldByType<L, T, "field_edge_connection">