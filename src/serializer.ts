import * as Blockly from 'blockly/core';
import { Blocks } from './blocks';
import types from './data/types';
import { ScopedBlock } from './blocks/extensions/scoped';
import { FieldLocalVariable } from './blocks/fields/field_local_variable';

export interface ISerializedWorkspace {
    workspaceState: Record<string, unknown>
    panPosition: { x: number, y: number }
    toolboxScrollPosition: { x: number, y: number } | undefined
}

export function serializeWorkspace(workspace: Blockly.WorkspaceSvg): ISerializedWorkspace {
    return {
        workspaceState: Blockly.serialization.workspaces.save(workspace),
        panPosition: { x: workspace.scrollX, y: workspace.scrollY },
        toolboxScrollPosition: workspace.getToolbox()?.getFlyout() ? { x: workspace.getToolbox()!.getFlyout()!.getWorkspace().scrollX, y: workspace.getToolbox()!.getFlyout()!.getWorkspace().scrollY } : undefined
    }
}

export function deserializeWorkspace(workspace: Blockly.WorkspaceSvg, serialized: ISerializedWorkspace) {
    Blockly.serialization.workspaces.load(serialized.workspaceState, workspace)
    // TODO: This does not take serialized target blocks into account
    workspace.scroll(serialized.panPosition.x, serialized.panPosition.y)
    if (serialized.toolboxScrollPosition) {
        workspace.getToolbox()?.getFlyout()?.getWorkspace().scroll(serialized.toolboxScrollPosition.x, serialized.toolboxScrollPosition.y)
    }
}

export function clearWorkspace(workspace: Blockly.WorkspaceSvg) {
    workspace.isClearing = true
    try {
        const existingGroup = Blockly.Events.getGroup();
        if (!existingGroup) {
            Blockly.Events.setGroup(true);
        }
        while (workspace.getTopBlocks().length) {
            workspace.getTopBlocks()[0].dispose(false);
        }
        while (workspace.getTopComments().length) {
            const topComments = workspace.getTopComments();
            topComments[topComments.length - 1].dispose();
        }
        Blockly.Events.setGroup(existingGroup);
    } finally {
        workspace.isClearing = false;
    }

    workspace.getToolbox()?.getFlyout()?.getWorkspace().scroll(0, 0)
    workspace.scroll(0, 0)
}

Blockly.serialization.registry.register(
    "edges",
    {
        save(workspace: Blockly.WorkspaceSvg) {
            const edges: { sourceBlockId: string, targetBlockId: string, sourceField: string, targetField: string }[] = []
            workspace.getAllBlocks().forEach(block => {
                if (Blocks.Types.isNodeBlock(block)) {
                    block.edgeConnections.forEach((value, key) => {
                        value.connections.forEach(connection => {
                            const targetBlock = connection.targetBlock()
                            if (targetBlock && Blocks.Types.isNodeBlock(targetBlock)) {
                                const targetFieldName = [...targetBlock.edgeConnections.entries()].find(([, value]) => value.connections.includes(connection.targetConnection!))?.[0]
                                if (!edges.find(edge => (edge.sourceBlockId === block.id && edge.targetBlockId === targetBlock.id) || (edge.sourceBlockId === targetBlock.id && edge.targetBlockId === block.id))) {
                                    edges.push({ sourceBlockId: block.id, targetBlockId: targetBlock.id, sourceField: key, targetField: targetFieldName! })
                                }
                            }
                        })
                    })
                }
            })
            return edges
        },
        load(state: { sourceBlockId: string, targetBlockId: string, sourceField: string, targetField: string }[], workspace: Blockly.WorkspaceSvg) {
            state.forEach(edge => {
                const sourceBlock = workspace.getBlockById(edge.sourceBlockId)
                const targetBlock = workspace.getBlockById(edge.targetBlockId)

                if (sourceBlock && targetBlock && Blocks.Types.isNodeBlock(sourceBlock) && Blocks.Types.isNodeBlock(targetBlock)) {
                    sourceBlock.connectNode(targetBlock, edge.sourceField, edge.targetField)
                }
            })
        },
        clear() {
            return { edges: [] }
        },
        priority: 1
    },
)

Blockly.serialization.registry.register(
    "local_variables",
    {
        save(workspace: Blockly.WorkspaceSvg) {
            const localVariables: { scope: string, type: string, instances: string[] }[] = []
            workspace.getBlocksByType(Blocks.Names.LIST.ANY_ALL).forEach(block => {
                const connectedBlock = block.getInput("LIST")?.connection?.targetBlock()
                if (connectedBlock) {
                    const typeString = connectedBlock.outputConnection?.getCheck()?.[0]
                    if (typeString) {
                        const type = types.utils.fromString(typeString)
                        if (types.utils.isList(type)) {
                            localVariables.push({ scope: block.id, type: types.utils.toString(type.elementType), instances: workspace.getBlocksByType(Blocks.Names.VARIABLE.LOCAL_GET).filter(variable => (variable as ScopedBlock).scope === block.id).map(variable => variable.id) })
                        }
                    }
                }
            })
            return localVariables
        },
        load(state: { scope: string, type: string, instances: string[] }[], workspace: Blockly.WorkspaceSvg) {
            state.forEach(variable => {
                const scopeBlock = workspace.getBlockById(variable.scope);
                const type = types.utils.fromString(variable.type);
                (scopeBlock?.getField("VALUE") as FieldLocalVariable).setType(type);
                variable.instances.forEach(id => {
                    const local = workspace.getBlockById(id) as ScopedBlock | null
                    if (local) {
                        local.scope = variable.scope
                    }

                })
            })
        },
        clear() {
            return { localVariables: [] }
        },
        priority: 1
    },
)