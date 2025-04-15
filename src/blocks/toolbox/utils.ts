import { BlockConnectionDefinition, DataTableStructure, GenericBlockDefinition, IsHiddenFunc } from "./builder/definitions"
import * as Blockly from "blockly/core"

export function hasIsHiddenFunc<T>(item: T): item is T & { isHidden: IsHiddenFunc } {
    return Object.prototype.hasOwnProperty.call(item, "isHidden")
}

export function evaluateIsHiddenFunc<T>(item: T, workspace: Blockly.Workspace, tableStructure: DataTableStructure): boolean {
    if (hasIsHiddenFunc(item)) {
        if (typeof item.isHidden === "function") {
            return item.isHidden(workspace, tableStructure)
        } else {
            return item.isHidden
        }
    }

    return false
}

function hasRegisterFunc<T>(item: T): item is T & { register: (workspace: Blockly.WorkspaceSvg) => void } {
    return Object.prototype.hasOwnProperty.call(item, "register")
}

export function registerCategory<T>(item: T, workspace: Blockly.WorkspaceSvg) {
    if (hasRegisterFunc(item)) {
        item.register(workspace)
    }
}

export function blockDefinitionToBlock(block: GenericBlockDefinition, workspace: Blockly.Workspace): Blockly.Block {
    return Blockly.serialization.blocks.append(blockDefinitionToBlockState(block), workspace, { recordUndo: false })
}

export function blockDefinitionToBlockState(block: GenericBlockDefinition): Blockly.serialization.blocks.State {
    const inputs: { [key: string]: Blockly.serialization.blocks.ConnectionState } | undefined = block.inputs ? Object.entries(block.inputs).map(([name, input]) => {
        return {
            [name]: {
                shadow: input.shadow ? blockDefinitionToBlockState(input.shadow) as Blockly.serialization.blocks.State : undefined,
                block: input.block ? blockDefinitionToBlockState(input.block) as Blockly.serialization.blocks.State : undefined
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
        type: block.type as string, // TODO: This is a hack
        fields,
        inputs,
        extraState: block.extraState,
        next: block.next ? {
            shadow: block.next.shadow ? blockDefinitionToBlockState(block.next.shadow) : undefined,
            block: block.next.block ? blockDefinitionToBlockState(block.next.block) : undefined
        } : undefined
    }
}

export function blockToBlockDefinition(block: Blockly.serialization.blocks.State | Blockly.Block): GenericBlockDefinition {
    if (block instanceof Blockly.Block) {
        return blockToBlockDefinition(Blockly.serialization.blocks.save(block)!)
    }

    const inputs: {
        [key: string]: BlockConnectionDefinition
    } | undefined = block.inputs ? Object.entries(block.inputs).map(([name, input]) => {
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
        type: block.type,
        fields,
        inputs,
        extraState: block.extraState,
        next: block.next ? {
            shadow: block.next.shadow ? blockToBlockDefinition(block.next.shadow) : undefined,
            block: block.next.block ? blockToBlockDefinition(block.next.block) : undefined
        } : undefined
    }
}