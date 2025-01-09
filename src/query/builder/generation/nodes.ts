import { Blocks } from "@/blocks"
import { languageAgnosticQueryGenerator } from "../query_generator"
import { NodeBlock } from "@/blocks/extensions/node"
import { QueryNodeInput } from "../query_tree"
import { FieldSetSelection } from "@/blocks/fields/field_set_selection"
import { FieldLabelTargetNode } from "@/blocks/fields/field_label_target_node"

languageAgnosticQueryGenerator.registerNode(Blocks.Names.NODE.SUBSET, (block) => {
    // const fields = generator.multilineStatementToCode(block, "FILTERS", " && ").trim()
    // return { definition: `function ${procedureName}(default) {\n  return conditionalSplit(default, p => ${fields === "" ? "false" : fields});\n}\n`, invocation: `${procedureName}(${input})` }

    return {
        id: block.id,
        inputs: {
            input: processEdgeConnectionPoint("INPUT", block as NodeBlock) ?? []
        },
        attributes: {
            name: block.getFieldValue("NAME")
        },
        operations: []
    }
})

languageAgnosticQueryGenerator.registerNode(Blocks.Names.NODE.TARGET, (block) => {
    return {
        id: block.id,
        inputs: {
            input: processEdgeConnectionPoint("INPUT", block as NodeBlock) ?? []
        },
        attributes: {
            name: (block.getField("LABEL") as FieldLabelTargetNode).getName() ?? ""
        }
    }
})

languageAgnosticQueryGenerator.registerNode(Blocks.Names.NODE.SET_ARITHMETIC, (block) => {
    return {
        id: block.id,
        inputs: {
            left: processEdgeConnectionPoint("LEFT", block as NodeBlock) ?? [],
            right: processEdgeConnectionPoint("RIGHT", block as NodeBlock) ?? []
        },
        attributes: {
            selection: (block.getField("SELECTION") as FieldSetSelection).getSelection()
        },
    }
})

function processEdgeConnectionPoint(inputName: string, block: NodeBlock): QueryNodeInput | QueryNodeInput[] | null {
    const connection = block.edgeConnections.get(inputName);

    const connections = connection?.connections
        .map(conn => {
            const targetBlock = conn.getSourceBlock().id === block.id ? conn.targetBlock() : conn.getSourceBlock();

            if (!targetBlock || !Blocks.Types.isNodeBlock(targetBlock)) return null;

            return targetBlock.type === Blocks.Names.NODE.SUBSET
                ? {
                    node: targetBlock.id,
                    output: targetBlock.edgeConnections.get("POSITIVE")?.connections.includes(conn.targetConnection!) ? "positive" : "negative"
                }
                : { node: targetBlock.id, output: null };
        })
        .filter(Boolean) as QueryNodeInput[];

    return connections?.length ? (connections.length === 1 ? connections[0] : connections) : null;
}