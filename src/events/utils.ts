import { Blocks } from "@/blocks"
import { FieldEdgeConnection } from "@/blocks/fields/field_edge_connection"
import { getEdgeId } from "@/utils/edges"
import * as Blockly from "blockly/core"

export const EDGE_CREATE = "edge_create"
export const EDGE_DELETE = "edge_delete"

export function getBlockFromEvent(e: Event, workspace: Blockly.Workspace): Blockly.Block | null {
    let element: HTMLElement | null = e.target as HTMLElement
    while(element) {
        if(element.hasAttribute("data-id") && workspace.getBlockById(element.getAttribute("data-id")!)) break
        element = element.parentElement
    }
    return element ? workspace.getBlockById(element.getAttribute("data-id")!) : null
}

export function getFieldFromEvent(e: Event, workspace: Blockly.Workspace, opt_block?: Blockly.Block): Blockly.Field | null {
    const target = e.target as Element
    let group: null | Element = target
    while (group && group.tagName !== "g") {
        group = group.parentElement
    }
    const block = opt_block ?? getBlockFromEvent(e, workspace)
    if(!block || block.inputList.length === 0 || !group) return null

    const fields = block.inputList.map(input => input.fieldRow.find(field => (field.getSvgRoot()?.isEqualNode(group) || field.getSvgRoot()?.contains(group)))).filter(p => p !== undefined)
    if(fields.length > 1) {
        console.warn("More than one field has been matched")
    }
    return fields[0] ?? null
}

export function getConnectionFromEvent(e: Event, workspace: Blockly.Workspace): Blockly.Connection | null {
    const target = e.target as Element
    if(target.hasAttribute("data-id") && target.hasAttribute("data-connection")) {
        const block = workspace.getBlockById(target.getAttribute("data-id")!)
        if(block && Blocks.Types.isNodeBlock(block)) {
            const connections = [...block.edgeConnections.values()].map(x => x.connections).reduce((p, c) => p.concat(c))
            return connections.find(conn => {
                const sourceBlock = conn.getSourceBlock()
                const targetBlock = conn.targetBlock()
                if(!conn.isConnected() || !targetBlock || !sourceBlock || !Blocks.Types.isNodeBlock(targetBlock) || !Blocks.Types.isNodeBlock(sourceBlock)) return false
                const sourceFieldName = [...block.edgeConnections.entries()].find(([, value]) => value.connections.includes(conn))?.[0]
                const targetFieldName = [...targetBlock.edgeConnections.entries()].find(([, value]) => value.connections.includes(conn.targetConnection!))?.[0]
                const connectionId = getEdgeId({sourceBlock: sourceBlock, targetBlock, sourceField: sourceBlock.getField(sourceFieldName!) as FieldEdgeConnection, targetField: targetBlock.getField(targetFieldName!) as FieldEdgeConnection})
                if(connectionId === target.getAttribute("data-connection")) return true

                return false
            }) ?? null
        }
    }

    return null
}