import { IType } from "@/data/types"
import * as Blockly from "blockly/core"

// This is needed because currently blockly defines BlockDefinition as any, see this Github Issue:
// https://github.com/google/blockly/issues/6828
// All functions of Block need to be called with ! because they always exist although typescript does not know that
export type BlockDefinition = { [Property in keyof Blockly.Block]?: Blockly.Block[Property] } & { [key: string]: unknown }

export function registerBlock(
    block: BlockDefinition,
    name: string
) {
    Blockly.Blocks[name] = block
}

export enum ConnectionType {
    BOOLEAN = "Boolean",
    TIMELINE_PROTOTYPE = "TimelinePrototype",
}

export function registerBlocksFromJsonArray<T extends (BlockDefinitionJson & { id: string })[]>(blocks: T): Readonly<Record<T[number]["id"], T[number]>> {
    for (const block of blocks) {
        if (block.output && typeof block.output !== "string") block.output = block.output.name

        for (const key in block) {
            if (key.startsWith("args")) {
                for (const arg of block[key as keyof BlockDefinitionJson] as (FieldDefinition | InputDefinition)[]) {
                    if (arg.check && typeof arg.check !== "string") {
                        arg.check = (arg.check as IType).name
                    }
                }
            }
        }
        const blockDefinition: BlockDefinition = {
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

export type BlockDefinitionJson = {
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
    id?: string
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

