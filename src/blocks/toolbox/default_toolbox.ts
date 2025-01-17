import "blockly/blocks";
import { Variables } from "@/blocks/toolbox/categories/variables";
import { Nodes } from "./categories/nodes";
import { DateTime } from "luxon";
import { defineBlock, defineCategory, defineToolbox } from "./toolbox_definition";
import types from "@/data/types";
import { FibBlock, MathBinaryOperationBlock, MathDividedByBlock, MathMinusBlock, MathNumberPropertyBlock, MathPlusBlock, MathTimesBlock, MathUnaryOperationBlock, NumberBlock } from "../definitions/math";
import { CompareIntervalBlock, CompareNumbersBlock, EqualsBlock, EqualsWithinBlock, GreaterBlock, GreaterEqualsBlock, IsNullBlock, LessBlock, LessEqualsBlock, MatchesBlock } from "../definitions/comparisons";
import { ListAnyAllBlock, ListArithmeticBlock, ListContainsBlock, ListEqualsBlock, ListLengthBlock } from "../definitions/lists";
import { ProperySelectBlock } from "../definitions/structs";
import { LogicNotBlock, LogicOrBlock } from "../definitions/logic";
import { TimelineAfterBlock, TimelineAfterIntervalBlock, TimelineDateBlock, TimelineEventOccursMatchBlock, TimelineOrBlock, TimelineQueryBlock, TimelineRepeatBlock, TimestampBlock } from "../definitions/timeline";

const mathNumberNull = defineBlock(NumberBlock).withFields({
    NUM: {
        value: ""
    }
})

export const DefaultToolbox = defineToolbox([
    defineCategory("%{BKY_VARIABLES}", "variables_category").asDynamicCategory(Variables),
    defineCategory("%{BKY_COMPARISONS}", "comparisons_category").withBlocks([
        defineBlock(EqualsBlock),
        defineBlock(MatchesBlock),
        defineBlock(EqualsWithinBlock).withInputs({
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
        defineBlock(GreaterBlock).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(LessBlock).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(GreaterEqualsBlock).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(LessEqualsBlock).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(CompareIntervalBlock).withInputs({
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
        defineBlock(CompareNumbersBlock).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            },
        }),
        defineBlock(FibBlock).withInputs({
            NUM: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(IsNullBlock).withCondition((_workspace, table) => {
            return !table.some(col => types.utils.fromString(col.type).nullable)
        }),
    ]
    ),
    defineCategory("%{BKY_ARITHMETIC}", "math_category").withBlocks([
        defineBlock(MathPlusBlock).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(MathMinusBlock).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(MathTimesBlock).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(MathDividedByBlock).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(MathBinaryOperationBlock).withInputs({
            A: {
                shadow: mathNumberNull
            },
            B: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(MathUnaryOperationBlock).withInputs({
            NUM: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(MathNumberPropertyBlock).withInputs({
            NUM: {
                shadow: mathNumberNull
            }
        }),
    ]),
    defineCategory("%{BKY_LISTS}", "list_category").withBlocks([
        defineBlock(ListArithmeticBlock),
        defineBlock(ListLengthBlock),
        defineBlock(ListContainsBlock),
        defineBlock(ListEqualsBlock),
        defineBlock(ListAnyAllBlock),
        defineBlock(ProperySelectBlock)
    ]),
    defineCategory("%{BKY_LOGIC}", "logic_category").withBlocks([
        defineBlock(LogicOrBlock),
        defineBlock(LogicNotBlock),
    ]),
    defineCategory("%{BKY_TIMELINE}", "history_category")
        .withBlocks([
            defineBlock(TimelineQueryBlock),
            // defineBlock(Blocks.Names.TIMELINE.EVENT_OCCURS),
            defineBlock(TimelineEventOccursMatchBlock),
            defineBlock(TimestampBlock).withInputs({
                TIMESTAMP: {
                    shadow: defineBlock(TimelineDateBlock).withFields({
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
            defineBlock(TimelineAfterBlock).withInputs({
                NUM: {
                    shadow: mathNumberNull
                }
            }),
            defineBlock(TimelineAfterIntervalBlock).withInputs({
                START: {
                    shadow: mathNumberNull
                },
                END: {
                    shadow: mathNumberNull
                },
            }),
            defineBlock(TimelineOrBlock),
            // defineBlock(Blocks.Names.TIMELINE.LOOP_UNTIL),
            defineBlock(TimelineRepeatBlock).withInputs({
                NUM: {
                    shadow: mathNumberNull
                }
            }),
        ]),
    defineCategory("%{BKY_NODES}", "nodes_category").asDynamicCategory(Nodes)
])