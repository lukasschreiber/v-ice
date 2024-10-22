import * as Blockly from "blockly/core"
import { FieldEdgeConnection, NodeConnectionType } from "@/blocks/fields/field_edge_connection"
import { EdgeCreate } from "@/events/events_edge_create"
import { Blocks } from "@/blocks"
import { EdgeDelete } from "@/events/events_edge_delete"
import { Edge } from "@/utils/edges"
import { showNotification } from "@/store/notifications/notification_emitter"
import { NotificationType } from "@/store/notifications/notification_config"

export type EdgeConnection = { type: Blockly.ConnectionType, connections: Blockly.Connection[] }

export type NodeExtension = Partial<Blockly.BlockSvg> & {
    isNode_: boolean
    drawEdges_: boolean
    edgeConnections: Map<string, EdgeConnection>
    shouldDrawEdges: () => boolean
    getConnectionFields: () => FieldEdgeConnection[]
    connectNode: (node: NodeBlock, source: string, target: string) => void
    unplugNodeConnection: (connection: Blockly.Connection) => void
    getConnectedNodes: (field: string) => NodeBlock[]
    getEdges: () => Edge[]
    deleteEdges: () => void
}

export type NodeBlock = NodeExtension & Blockly.Block
export type NodeBlockSvg = NodeExtension & Blockly.BlockSvg

export interface INodeBlockState {
    edges: { sourceBlockId: string, targetBlockId: string, sourceField: string, targetField: string }[]
}

// Depth First Search to check for cycles
// backwards means from input to output
function hasCycle(node: NodeBlock, targetId: string, visited: Set<string>): boolean {
    if (node.id === targetId) return true;
    if (visited.has(node.id)) return false;

    visited.add(node.id);

    const inputConnections = node.getConnectionFields()
        .filter(field => field.getConnectionType() === NodeConnectionType.INPUT)
        .flatMap(field => node.edgeConnections.get(field.name!)?.connections)
        .filter(conn => conn && conn.isConnected())
        .map(conn => conn!.targetBlock() as NodeBlock);

    for (const connectedNode of inputConnections) {
        if (hasCycle(connectedNode, targetId, visited)) {
            return true;
        }
    }

    return false;
}

const nodeLinkMixin: NodeExtension = {
    isNode_: true,
    drawEdges_: true,
    edgeConnections: new Map(),
    shouldDrawEdges: function () {
        return this.drawEdges_ && !this.isInFlyout && !this.isInsertionMarker!()
    },
    getConnectionFields: function () {
        return (this.inputList?.map(input => input.fieldRow.find(field => field instanceof FieldEdgeConnection)) ?? []).filter(field => field !== undefined) as FieldEdgeConnection[]
    },
    unplugNodeConnection: function (connection) {
        for (const [key, value] of this.edgeConnections.entries()) {
            const index = value.connections.indexOf(connection)
            if (index !== -1) {
                const removedConnections = value.connections.splice(index, 1)
                removedConnections.forEach(connection => {
                    if (this.workspace) {
                        const targetBlock = connection.targetBlock()
                        if (targetBlock && Blocks.Types.isNodeBlock(targetBlock)) {
                            const targetFieldName = [...targetBlock.edgeConnections.entries()].find(([, value]) => value.connections.includes(connection.targetConnection!))?.[0]
                            Blockly.Events.fire(new EdgeDelete(connection.getSourceBlock()!.id, targetBlock.id, key, targetFieldName, this.workspace.id))
                        }
                    }
                    connection.disconnect()
                    connection.dispose()
                })
                this.edgeConnections.set(key, value)
            }
        }
    },
    connectNode: function (this: NodeBlock, node, source, target) {
        const sourceConnections = this.edgeConnections.get(source)
        const targetConnections = node.edgeConnections.get(target)

        // check if we try to connect to the same node
        if (this.id === node.id) {
            showNotification(Blockly.Msg.NOTIFICATION_SELF_CONNECT, NotificationType.NodeLinkConnectionFailureSelf)
            return;
        }
        // check if we are connecting an input to an input or an output to an output
        if (sourceConnections?.type === targetConnections?.type) {
            if (sourceConnections?.type === Blockly.ConnectionType.PREVIOUS_STATEMENT && targetConnections?.type === Blockly.ConnectionType.PREVIOUS_STATEMENT) {
                showNotification(Blockly.Msg.NOTIFICATION_INPUT_TO_INPUT, NotificationType.NodeLinkConnectionFailure)
            } else {
                showNotification(Blockly.Msg.NOTIFICATION_OUTPUT_TO_OUTPUT, NotificationType.NodeLinkConnectionFailure)
            }
            return;
        }
        // check if the exact connection already exists
        if (sourceConnections?.connections.some(connection => connection.targetBlock()?.id === node.id) && targetConnections?.connections.some(connection => connection.targetBlock()?.id === this.id)) return
        // check if we are creating a cycle
        if ((sourceConnections?.type === Blockly.ConnectionType.PREVIOUS_STATEMENT && hasCycle(node, this.id, new Set())
            || (sourceConnections?.type === Blockly.ConnectionType.NEXT_STATEMENT && hasCycle(this, node.id, new Set())))) {
            showNotification(Blockly.Msg.NOTIFICATION_NO_CYCLE, NotificationType.NodeLinkConnectionFailureCycle)
            return;
        }


        if (sourceConnections && targetConnections) {
            const sourceConnection = this.makeConnection_!(sourceConnections.type)
            const targetConnection = node.makeConnection_(targetConnections.type)

            const sourceXY = (this.getField!(source) as FieldEdgeConnection).getEdgeXY()
            sourceConnection.x = sourceXY.x
            sourceConnection.y = sourceXY.y

            const targetXY = (node.getField!(target) as FieldEdgeConnection).getEdgeXY()
            targetConnection.x = targetXY.x
            targetConnection.y = targetXY.y

            this.edgeConnections.set(source, { type: sourceConnections.type, connections: [sourceConnection, ...sourceConnections.connections] })
            node.edgeConnections.set(target, { type: targetConnections.type, connections: [targetConnection, ...targetConnections.connections] })

            try {
                sourceConnection.connect(targetConnection)
            } catch (e) {
                //TODO: connect tries to reposition the XML element, at the moment we just ignore that it fails
            }
            Blockly.Events.fire(new EdgeCreate(this.id, node.id, source, target, node.workspace.id))
        }
        this.render!()
    },
    getConnectedNodes: function (field) {
        return this.edgeConnections.get(field)?.connections
            .filter(connection => connection.isConnected() && connection.targetBlock() !== null)
            .map(connection => connection.targetBlock()) as NodeBlock[]
    },
    getEdges: function (this: NodeBlockSvg) {
        return [...this.edgeConnections.entries()].flatMap(([source, { connections }]) => {
            return connections.map(connection => {
                const targetBlock = connection.targetBlock() as NodeBlock | null
                if (!targetBlock) return null
                const targetField = [...targetBlock.edgeConnections.entries()].find(([, value]) => value.connections.includes(connection.targetConnection!))?.[0]
                return { sourceBlock: this, targetBlock: targetBlock, sourceField: this.getField!(source) as FieldEdgeConnection, targetField: targetBlock.getField(targetField!) as FieldEdgeConnection }
            }).filter(edge => edge !== null) as Edge[]
        })
    },
    deleteEdges: function (this: NodeBlockSvg) {
        this.edgeConnections.forEach(({ connections }) => {
            connections.forEach(connection => {
                this.unplugNodeConnection(connection)
            })
        })
    }
}

Blockly.Extensions.register(
    'node_block',
    function (this: NodeBlockSvg) {
        this.mixin(nodeLinkMixin)
        // add connections for all link connectors
        const connections = this.getConnectionFields()

        // this is very important, the mixed in Map would be the same for every block using the mixin
        this.edgeConnections = new Map()
        for (const connection of connections) {
            const type = connection.getConnectionType() === NodeConnectionType.INPUT ? Blockly.ConnectionType.PREVIOUS_STATEMENT : Blockly.ConnectionType.NEXT_STATEMENT
            this.edgeConnections.set(connection.name!, { type: type, connections: [] })
        }
    },
);