import { IType } from "@/data/types"
import * as Blockly from "blockly/core"
import { BlockExtension } from "@/blocks/block_extensions"

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

export function registerBlocks<T extends (BlockDefinition & { id: string })[]>(blocks: T): Readonly<Record<T[number]["id"], T[number]>> {
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

    const extensions = []

    for (const extension of block.extensions ?? []) {
        const ext = getExtensionInstance(extension)
        if (!Blockly.Extensions.isRegistered(ext.name)) {
            ext.register()
        }
        extensions.push(ext.name)
    }

    const result: BlocklyJsonBlockDefinition = {
        ...block,
        extensions: extensions,
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

export type BlockDefinition = {
    id?: string
    color?: number | string
    helpUrl?: string
    lines?: {text: string, args: (FieldDefinition | InputDefinition)[], align?: "RIGHT" | "CENTRE" | "LEFT"}[]
    nextStatement?: null | string | string[]
    previousStatement?: null | string | string[]
    connectionType?: string
    output?: IType | string
    inputsInline?: boolean
    tooltip?: string
    style?: string
    mutator?: string
    extensions?: (new (...args: any[]) => BlockExtension<any>)[]
    data?: object | string
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

