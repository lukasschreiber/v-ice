import { IType } from "@/data/types"
import * as Blockly from "blockly/core"
import { BlockExtension, ExtensionMixins, RegistrableExtension } from "@/blocks/block_extensions"
import { MutatorMixin, RegistrableMutator } from "./block_mutators"
import { LanguageAgnosticQueryGenerator, languageAgnosticQueryGenerator } from "@/query/builder/query_generator"
import { QueryNode, QueryOperation } from "@/query/builder/query_tree"
import { NodeBlockExtension } from "./extensions/node"

// This is needed because currently blockly defines BlockDefinition as any, see this Github Issue:
// https://github.com/google/blockly/issues/6828
// All functions of Block need to be called with ! because they always exist although typescript does not know that
export type BlocklyBlockDefinition = { [Property in keyof Blockly.Block]?: Blockly.Block[Property] } & { [key: string]: unknown }

export function registerBlock<T extends (BlockDefinition & { id: string })>(block: T): Readonly<Record<T["id"], T>> {
    return registerBlocks([block])
}

export enum ConnectionType {
    BOOLEAN = "Boolean",
    TIMELINE_PROTOTYPE = "TimelinePrototype",
}

export function registerBlocks<T extends Array<BlockDefinition<never[], never> & { id: string }>>(blocks: T): Readonly<Record<T[number]["id"], T[number]>> {
    for (const definition of blocks) {
        const block = convertBlockDefinitionToBlocklyJson(definition)
        if (block.output && typeof block.output !== "string") block.output = block.output.name

        for (const key in block) {
            if (key.startsWith("args")) {
                for (const arg of block[key as keyof BlocklyJsonBlockDefinition] as (FieldDefinition | InputDefinition)[]) {
                    if (arg.check && typeof arg.check !== "string") {
                        arg.check = (arg.check as IType).name
                    }
                }
            }
        }
        const blockDefinition: BlocklyBlockDefinition = {
            init: function () {
                this.jsonInit!(block)
                if (block.data) {
                    this.data = JSON.stringify(block.data)
                }
            },
        }
        Blockly.Blocks[block.id] = blockDefinition
    }

    return blocks.reduce((acc, block) => {
        acc[block.id as T[number]["id"]] = block
        return acc
    }, {} as Record<T[number]["id"], T[number]>)
}

function convertBlockDefinitionToBlocklyJson(block: BlockDefinition): BlocklyJsonBlockDefinition {

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
        if (extensions.includes(getExtensionInstance(NodeBlockExtension).name)) {
            languageAgnosticQueryGenerator.registerNode(block.id, block.code)
        } else {
            // TODO this could probably have nicer types but at the moment it's not worth the effort
            languageAgnosticQueryGenerator.registerOperation(block.id, block.code as any)
        }
    }

    const result: BlocklyJsonBlockDefinition = {
        ...block,
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

function getExtensionInstance<T extends BlockExtension<any>>(extension: new (...args: any[]) => T): T {
    const constructorName = extension.name
    if (!extensionInstances[constructorName]) {
        extensionInstances[constructorName] = new extension()
    }
    return extensionInstances[constructorName] as T
}

const extensionInstances: Record<string, BlockExtension<any>> = {}

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

export interface BlockDefinition<Es extends RegistrableExtension[] = never[], M extends RegistrableMutator = never> {
    id: string
    color?: number | string
    helpUrl?: string
    lines?: { text: string, args: (FieldDefinition | InputDefinition)[], align?: "RIGHT" | "CENTRE" | "LEFT" }[]
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
    code?: (block: Blockly.Block & ExtensionMixins<Es> & MutatorMixin<M>, generator: LanguageAgnosticQueryGenerator) => ExtensionsMatch<Es, typeof NodeBlockExtension> extends true ? QueryNode : QueryOperation
}

export interface RegistrableBlock extends BlockDefinition {
    register(): void
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

export function createBlockDefinition<
    Es extends RegistrableExtension[] = any[],
    M extends RegistrableMutator = any
>(definition: BlockDefinition<Es, M>): RegistrableBlock {
    const genericDefinition = definition as BlockDefinition
    return {
        ...genericDefinition,
        register() {
            registerBlock(genericDefinition)
        }
    };
}

type ExtensionsMatch<T, U> = T extends (infer R)[] ? R extends U ? true : false : false