import { NodeBlock } from "@/blocks/extensions/node";
import { FieldEdgeConnection, NodeConnectionType } from "@/blocks/fields/field_edge_connection";

export interface Edge {
    sourceBlock?: NodeBlock,
    sourceField?: FieldEdgeConnection,
    targetBlock?: NodeBlock,
    targetField?: FieldEdgeConnection
}

// create a class edge with this function in it
export function getEdgeId(edge: Edge): string {
    if(!edge.sourceBlock || !edge.sourceField || !edge.targetBlock || !edge.targetField) throw new Error("Edge is not complete")

    // edge ids always start with the output edge and end with the input edge
    // this is to ensure that the edge is unique
    if(edge.sourceField.getConnectionType() === NodeConnectionType.INPUT) {
        return `${edge.targetBlock.id}-${edge.targetField.name}_${edge.sourceBlock.id}-${edge.sourceField.name}`
    } else {
        return `${edge.sourceBlock.id}-${edge.sourceField.name}_${edge.targetBlock.id}-${edge.targetField.name}`
    }
}