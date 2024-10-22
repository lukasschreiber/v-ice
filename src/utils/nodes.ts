import { Blocks } from '@/blocks';
import { NodeBlock } from '@/blocks/extensions/node';
import { NodeConnectionType } from '@/blocks/fields/field_edge_connection';
import * as Blockly from 'blockly';

export function getAllBlocksInGraph(workspace: Blockly.WorkspaceSvg): Blockly.Block[] {
    const blocks: Blockly.Block[] = [];

    const sourceNode = workspace.getTopBlocks(true).find(block => block.type === Blocks.Names.NODE.SOURCE) as NodeBlock | undefined
    if (sourceNode) {
        for (const node of bfsWithDependencies(sourceNode)) {
            if (node.type === Blocks.Names.NODE.SOURCE) continue

            blocks.push(node, ...node.getDescendants(false))
        }
    }

    return blocks;
}

// TODO: Document this function
export function bfsWithDependencies(startNode: NodeBlock): NodeBlock[] {
    const visited = new Set<string>();
    const inDegrees = new Map<string, number>();
    const queue: NodeBlock[] = [];
    const result: NodeBlock[] = [];
    const nodeMap = new Map<string, NodeBlock>();

    // Helper function to get all connected nodes (both input and output)
    function getConnectedNodes(node: NodeBlock): NodeBlock[] {
        return node.getConnectionFields()
            .flatMap(field => node.edgeConnections.get(field.name!)?.connections)
            .filter(conn => conn && conn.isConnected())
            .map(conn => conn!.targetBlock() as NodeBlock);
    }

    // Initialize the in-degree map and node map
    const allNodes: NodeBlock[] = [startNode];
    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        nodeMap.set(node.id, node);
        visited.add(node.id);
        const connectedNodes = getConnectedNodes(node);
        for (const connectedNode of connectedNodes) {
            if (!visited.has(connectedNode.id)) {
                allNodes.push(connectedNode);
                visited.add(connectedNode.id);
            }
        }
    }

    // Reset visited set for actual processing
    visited.clear();

    // Calculate in-degrees
    for (const node of allNodes) {
        inDegrees.set(node.id, 0);
    }

    for (const node of allNodes) {
        const outputConnections = node.getConnectionFields()
            .filter(field => field.getConnectionType() !== NodeConnectionType.INPUT)
            .flatMap(field => node.edgeConnections.get(field.name!)?.connections)
            .filter(conn => conn && conn.isConnected())
            .map(conn => conn!.targetBlock() as NodeBlock);

        for (const connectedNode of outputConnections) {
            inDegrees.set(connectedNode.id, (inDegrees.get(connectedNode.id) ?? 0) + 1);
        }
    }

    // Initialize the queue with nodes having in-degree of 0
    for (const [nodeId, degree] of inDegrees.entries()) {
        if (degree === 0) {
            const node = nodeMap.get(nodeId);
            if (node) {
                queue.push(node);
            }
        }
    }

    // Process the nodes
    while (queue.length > 0) {
        const currentNode = queue.shift()!;
        result.push(currentNode);
        visited.add(currentNode.id);

        const outputConnections = currentNode.getConnectionFields()
            .filter(field => field.getConnectionType() !== NodeConnectionType.INPUT)
            .flatMap(field => currentNode.edgeConnections.get(field.name!)?.connections)
            .filter(conn => conn && conn.isConnected())
            .map(conn => conn!.targetBlock() as NodeBlock);

        for (const connectedNode of outputConnections) {
            if (visited.has(connectedNode.id)) continue;
            const currentInDegree = inDegrees.get(connectedNode.id) ?? 0;
            inDegrees.set(connectedNode.id, currentInDegree - 1);
            if (inDegrees.get(connectedNode.id) === 0) {
                queue.push(connectedNode);
            }
        }
    }

    return result;
}