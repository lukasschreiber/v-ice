import { Blocks } from "@/blocks";
import { ConnectionType, createBlockDefinition, registerBlocks } from "@/blocks/block_definitions";
import { NodeConnectionType } from "@/blocks/fields/field_edge_connection";
import { NodeBlockExtension } from "../extensions/node";
import { FieldLabelTargetNode } from "../fields/field_label_target_node";
import { FieldSetSelection } from "../fields/field_set_selection";

export default registerBlocks([
    createBlockDefinition({
        id: Blocks.Names.NODE.SOURCE,
        lines: [
            {
                text: "%{BKY_SOURCE}",
                args: []
            },
            {
                text: "%1",
                args: [
                    {
                        type: "field_edge_connection",
                        name: "OUTPUT",
                        text: "%{BKY_SOURCE}",
                        connectionType: NodeConnectionType.OUTPUT
                    }
                ]
            }
        ],
        style: "node_blocks",
        helpUrl: "#source-node",
        extensions: [NodeBlockExtension]
    }),
    createBlockDefinition({
        id: Blocks.Names.NODE.TARGET,
        lines: [
            {
                text: "%1",
                args: [
                    {
                        type: "field_label_target_node",
                        name: "LABEL",
                        text: "%{BKY_TARGET}"
                    }
                ]
            },
            {
                text: "%1",
                args: [
                    {
                        type: "field_edge_connection",
                        name: "INPUT",
                        text: "%{BKY_TARGET}",
                        connectionType: NodeConnectionType.INPUT
                    }
                ]
            }
        ],
        style: "node_blocks",
        helpUrl: "#target-node",
        extensions: [NodeBlockExtension],
        code: (block, generator) => {
            return {
                id: block.id,
                inputs: {
                    input: generator.processEdgeConnectionPoint("INPUT", block)
                },
                attributes: {
                    name: (block.getField("LABEL") as FieldLabelTargetNode).getName() ?? ""
                }
            }
        }
    }),
    createBlockDefinition({
        id: Blocks.Names.NODE.SUBSET,
        lines: [
            {
                text: "%{BKY_SUBSET} %1",
                args: [
                    {
                        type: "field_input",
                        name: "NAME",
                        text: "%{BKY_MY_SUBSET}",
                    },
                ]
            },
            {
                text: "%1",
                args: [
                    {
                        type: "field_edge_connection",
                        name: "INPUT",
                        text: "%{BKY_INPUT}",
                        connectionType: NodeConnectionType.INPUT
                    }
                ]
            },
            {
                text: "%1",
                args: [
                    {
                        type: "input_statement",
                        name: "FILTERS",
                        check: ConnectionType.BOOLEAN
                    },
                ]
            },
            {
                text: "%1",
                args: [
                    {
                        type: "field_edge_connection",
                        name: "POSITIVE",
                        text: "%{BKY_POSITIVE_EDGE}",
                        connectionType: NodeConnectionType.POSITIVE
                    }
                ]
            },
            {
                text: "%1",
                args: [
                    {
                        type: "field_edge_connection",
                        name: "NEGATIVE",
                        text: "%{BKY_NEGATIVE_EDGE}",
                        connectionType: NodeConnectionType.NEGATIVE
                    }
                ]
            }],
        style: "capped_node_blocks",
        helpUrl: "#subset-node",
        extensions: [NodeBlockExtension],
        code: (block, generator) => {
            // const fields = generator.multilineStatementToCode(block, "FILTERS", " && ").trim()
            // return { definition: `function ${procedureName}(default) {\n  return conditionalSplit(default, p => ${fields === "" ? "false" : fields});\n}\n`, invocation: `${procedureName}(${input})` }

            return {
                id: block.id,
                inputs: {
                    input: generator.processEdgeConnectionPoint("INPUT", block)
                },
                attributes: {
                    name: block.getFieldValue("NAME")
                },
                operations: []
            }
        }
    }),
    createBlockDefinition({
        id: Blocks.Names.NODE.SET_ARITHMETIC,
        lines: [
            {
                text: "%1 %2",
                args: [
                    {
                        type: "field_edge_connection",
                        name: "LEFT",
                        text: "%{BKY_LEFT}",
                        connectionType: NodeConnectionType.INPUT
                    },
                    {
                        type: "field_set_selection",
                        name: "SELECTION",
                        selected: ["INTERSECTION", "LEFT_EXCLUSIVE", "RIGHT_EXCLUSIVE"],
                    },
                ]
            },
            {
                text: "%1",
                args: [
                    {
                        type: "field_edge_connection",
                        name: "OUTPUT",
                        text: "%{BKY_OUTPUT}",
                        connectionType: NodeConnectionType.OUTPUT
                    }
                ]
            },
            {
                text: "%1",
                args: [
                    {
                        type: "field_edge_connection",
                        name: "RIGHT",
                        text: "%{BKY_RIGHT}",
                        connectionType: NodeConnectionType.INPUT
                    }
                ]
            }
        ],
        style: "node_blocks",
        helpUrl: "#set-arithmetic-node",
        extensions: [NodeBlockExtension],
        code: (block, generator) => {
            return {
                id: block.id,
                inputs: {
                    left: generator.processEdgeConnectionPoint("LEFT", block),
                    right: generator.processEdgeConnectionPoint("RIGHT", block)
                },
                attributes: {
                    selection: (block.getField("SELECTION") as FieldSetSelection).getSelection()
                },
            }
        }
    })
] as const)