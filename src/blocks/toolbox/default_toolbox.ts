import "blockly/blocks";
import "@/blocks/definitions"
import { Variables } from "@/blocks/toolbox/categories/variables";
import { Nodes } from "./categories/nodes";
import { Blocks } from "@/blocks";
import { DateTime } from "luxon";
import { defineBlock, defineCategory, defineToolbox } from "./toolbox_definition";
import types from "@/data/types";

const mathNumberNull = defineBlock(Blocks.Names.MATH.NUMBER).withFields({
    NUM: {
        value: ""
    }
})

export const DefaultToolbox = defineToolbox([
    defineCategory("%{BKY_VARIABLES}", "variables_category").asDynamicCategory(Variables),
    defineCategory("%{BKY_COMPARISONS}", "comparisons_category").withBlocks([
        defineBlock(Blocks.Names.COMPARISON.EQUALS),
        defineBlock(Blocks.Names.COMPARISON.MATCHES),
        defineBlock(Blocks.Names.COMPARISON.EQUALS_WITHIN).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            },
            DELTA: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.COMPARISON.GREATER).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.COMPARISON.LESS).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.COMPARISON.GREATER_EQUALS).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.COMPARISON.LESS_EQUALS).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.COMPARISON.INTERVAL).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            },
            C: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.COMPARISON.NUMBERS).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            },
        }),
        defineBlock(Blocks.Names.COMPARISON.NULL).withCondition((_workspace, table) => {
            return !table.some(col => types.utils.fromString(col.type).nullable)
        }),
    ]
    ),
    defineCategory("%{BKY_ARITHMETIC}", "math_category").withBlocks([
        defineBlock(Blocks.Names.MATH.PLUS).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.MATH.MINUS).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.MATH.TIMES).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.MATH.DIVIDED_BY).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.MATH.BINARY).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.MATH.UNARY).withInputs({
            NUM: {
                shadow: mathNumberNull
            }
        }),
        // defineBlock(Blocks.Names.MATH.CONSTANTS),
        // defineBlock(Blocks.Names.MATH.CONSTRAIN).withInputs({
        //     NUM: {
        //         shadow: mathNumberNull
        //     },
        //     LOW: {
        //         shadow: mathNumberNull
        //     },
        //     HIGH: {
        //         shadow: mathNumberNull
        //     }
        // }),
        defineBlock(Blocks.Names.MATH.NUMBER_PROPERTY).withInputs({
            NUM: {
                shadow: mathNumberNull
            }
        }),
    ]),
    defineCategory("%{BKY_LISTS}", "list_category").withBlocks([
        defineBlock(Blocks.Names.LIST.MATH),
        defineBlock(Blocks.Names.LIST.LENGTH),
        // defineBlock(Blocks.Names.LIST.FLATTEN),
        defineBlock(Blocks.Names.LIST.CONTAINS),
        defineBlock(Blocks.Names.LIST.EQUALS),
        defineBlock(Blocks.Names.LIST.ANY_ALL),
        defineBlock(Blocks.Names.STRUCTS.GET_PROPERTY)
    ]),
    defineCategory("%{BKY_LOGIC}", "logic_category").withBlocks([
        defineBlock(Blocks.Names.LOGIC.OR),
        defineBlock(Blocks.Names.LOGIC.NOT),
    ]),
    defineCategory("%{BKY_TIMELINE}", "history_category")
    // .withCondition((_workspace, table) => {
    //     return !table.some(col => types.utils.isTimeline(types.utils.fromString(col.type)))
    // })
    .withBlocks([
        defineBlock(Blocks.Names.TIMELINE.QUERY),
        // defineBlock(Blocks.Names.TIMELINE.EVENT_OCCURS),
        defineBlock(Blocks.Names.TIMELINE.EVENT_OCCURS_MATCH),
        defineBlock(Blocks.Names.TIMELINE.TIMESTAMP).withInputs({
            TIMESTAMP: {
                shadow: defineBlock(Blocks.Names.TIMELINE.DATE_PICKER).withFields({
                    TIMESTAMP: {
                        value: DateTime.local().toFormat("dd.MM.yyyy"),
                    }
                })
            }
        }),
        // defineBlock(Blocks.Names.TIMELINE.START_OF_INTERVAL).withCondition((_workspace, table) => {
        //     return !table.some(col => {
        //         const type = types.utils.fromString(col.type)
        //         return types.utils.isTimeline(type) && (types.utils.isInterval(type.elementType) || (types.utils.isUnion(type.elementType) && type.elementType.types.some(types.utils.isInterval)))
        //     })
        // }),
        // defineBlock(Blocks.Names.TIMELINE.END_OF_INTERVAL).withCondition((_workspace, table) => {
        //     return !table.some(col => {
        //         const type = types.utils.fromString(col.type)
        //         return types.utils.isTimeline(type) && (types.utils.isInterval(type.elementType) || (types.utils.isUnion(type.elementType) && type.elementType.types.some(types.utils.isInterval)))
        //     })
        // }),
        defineBlock(Blocks.Names.TIMELINE.AFTER).withInputs({
            NUM: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.TIMELINE.AFTER_INTERVAL).withInputs({
            START: {
                shadow: mathNumberNull
            },
            END: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(Blocks.Names.TIMELINE.EITHER_OR),
        // defineBlock(Blocks.Names.TIMELINE.LOOP_UNTIL),
        defineBlock(Blocks.Names.TIMELINE.LOOP_COUNT).withInputs({
            NUM: {
                shadow: mathNumberNull
            }
        }),
    ]),
    defineCategory("%{BKY_NODES}", "nodes_category").asDynamicCategory(Nodes)
])