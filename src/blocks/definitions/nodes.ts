import { Blocks } from "@/blocks";
import { ConnectionType, registerBlocksFromJsonArray } from "@/blocks/block_definitions";
import { NodeConnectionType } from "@/blocks/fields/field_edge_connection";

export default registerBlocksFromJsonArray([
    {
        id: Blocks.Names.NODE.SOURCE,
        message0: "%{BKY_SOURCE}",
        message1: "%1",
        args0: [],
        args1: [
            {
                type: "field_edge_connection",
                name: "OUTPUT",
                text: "%{BKY_SOURCE}",
                connectionType: NodeConnectionType.OUTPUT
            }
        ],
        style: "node_blocks",
        helpUrl: "#source-node",
        extensions: ["node_block"]
    },
    {
        id: Blocks.Names.NODE.TARGET,
        message0: "%1",
        message1: "%1",
        args0: [
            {
                type: "field_label_target_node",
                text: "%{BKY_TARGET}",
                name: "LABEL"
            },
        ],
        args1: [
            {
                type: "field_edge_connection",
                name: "INPUT",
                text: "%{BKY_TARGET}",
                connectionType: NodeConnectionType.INPUT
            }
        ],
        style: "node_blocks",
        helpUrl: "#target-node",
        extensions: ["node_block"]
    },
    {
        id: Blocks.Names.NODE.SUBSET,
        message0: "%{BKY_SUBSET} %1",
        message1: "%1",
        message2: "%1",
        message3: "%1",
        message4: "%1",
        args0: [
            {
                type: "field_input",
                name: "NAME",
                text: "%{BKY_MY_SUBSET}",
            },
        ],
        args1: [
            {
                type: "field_edge_connection",
                name: "INPUT",
                text: "%{BKY_INPUT}",
                connectionType: NodeConnectionType.INPUT
            }
        ],
        args2: [
            {
                type: "input_statement",
                name: "FILTERS",
                check: ConnectionType.BOOLEAN
            },
        ],
        args3: [
            {
                type: "field_edge_connection",
                name: "POSITIVE",
                text: "%{BKY_POSITIVE_EDGE}",
                connectionType: NodeConnectionType.POSITIVE
            }
        ],
        args4: [
            {
                type: "field_edge_connection",
                name: "NEGATIVE",
                text: "%{BKY_NEGATIVE_EDGE}",
                connectionType: NodeConnectionType.NEGATIVE
            }
        ],
        style: "capped_node_blocks",
        helpUrl: "#subset-node",
        extensions: ["node_block"]
    },
    {
        id: Blocks.Names.NODE.SET_ARITHMETIC,
        message0: "%1 %2",
        args0: [
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
        ],
        message1: "%1",
        args1: [
            {
                type: "field_edge_connection",
                name: "OUTPUT",
                text: "%{BKY_OUTPUT}",
                connectionType: NodeConnectionType.OUTPUT
            }
        ],
        message2: "%1",
        args2: [
            {
                type: "field_edge_connection",
                name: "RIGHT",
                text: "%{BKY_RIGHT}",
                connectionType: NodeConnectionType.INPUT
            }
        ],
        style: "node_blocks",
        helpUrl: "#set-arithmetic-node",
        extensions: ["node_block"]
    }
] as const)