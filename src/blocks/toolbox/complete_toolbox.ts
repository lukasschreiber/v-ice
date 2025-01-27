import "blockly/blocks";
import { Variables } from "@/blocks/toolbox/categories/variables";
import { Nodes } from "./categories/nodes";
import { DateTime } from "luxon";
import { defineBlock, defineCategory, defineToolbox } from "./toolbox_definition";
import types from "@/data/types";
import { FibBlock, MathBinaryOperationBlock, MathConstantsBlock, MathConstrainBlock, MathDividedByBlock, MathMinusBlock, MathNumberPropertyBlock, MathPlusBlock, MathTimesBlock, MathUnaryOperationBlock, NumberBlock } from "../definitions/math";
import { CompareIntervalBlock, CompareNumbersBlock, EqualsBlock, EqualsWithinBlock, GreaterBlock, GreaterEqualsBlock, IsNullBlock, LessBlock, LessEqualsBlock, MatchesBlock } from "../definitions/comparisons";
import { ListAnyAllBlock, ListArithmeticBlock, ListContainsBlock, ListEqualsBlock, ListFlattenBlock, ListImmediateBlock, ListLengthBlock } from "../definitions/lists";
import { ProperySelectBlock, StructBlock } from "../definitions/structs";
import { BooleanBlock, LogicNotBlock, LogicOrBlock } from "../definitions/logic";
import { TimelineAfterBlock, TimelineAfterIntervalBlock, TimelineDateBlock, TimelineEndOfIntervalBlock, TimelineEventOccursMatchBlock, TimelineOrBlock, TimelineQueryBlock, TimelineRepeatBlock, TimelineStartOfIntervalBlock, TimelineUntilBlock, TimestampBlock } from "../definitions/timeline";
import { EnumSelectBlock } from "../definitions/enums";

const mathNumberNull = defineBlock(NumberBlock).withFields({
    NUM: {
        value: ""
    }
})

export const CompleteToolbox = defineToolbox([
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
        defineBlock(IsNullBlock).withCondition((_workspace, table) => {
            return !table.some(col => col.type.nullable)
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
        defineBlock(MathConstantsBlock),
        defineBlock(MathConstrainBlock).withInputs({
            NUM: {
                shadow: mathNumberNull
            },
            LOW: {
                shadow: mathNumberNull
            },
            HIGH: {
                shadow: mathNumberNull
            }
        }),
        defineBlock(FibBlock).withInputs({
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
        defineBlock(ProperySelectBlock),
        defineBlock(ListFlattenBlock)
    ]),
    defineCategory("%{BKY_LOGIC}", "logic_category").withBlocks([
        defineBlock(LogicOrBlock),
        defineBlock(LogicNotBlock),
    ]),
    defineCategory("%{BKY_TIMELINE}", "history_category")
        .withBlocks([
            defineBlock(TimelineQueryBlock),
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
            defineBlock(TimelineStartOfIntervalBlock).withCondition((_workspace, table) => {
                return !table.some(col => {
                    return types.utils.isTimeline(col.type) && (types.utils.isInterval(col.type.elementType) || (types.utils.isUnion(col.type.elementType) && col.type.elementType.types.some(types.utils.isInterval)))
                })
            }),
            defineBlock(TimelineEndOfIntervalBlock).withCondition((_workspace, table) => {
                return !table.some(col => {
                    return types.utils.isTimeline(col.type) && (types.utils.isInterval(col.type.elementType) || (types.utils.isUnion(col.type.elementType) && col.type.elementType.types.some(types.utils.isInterval)))
                })
            }),
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
            defineBlock(TimelineUntilBlock),
            defineBlock(TimelineRepeatBlock).withInputs({
                NUM: {
                    shadow: mathNumberNull
                }
            }),
        ]),
    defineCategory("%{BKY_PRIMITIVES}", "primitives_category").withBlocks([
        defineBlock(StructBlock),
        defineBlock(BooleanBlock),
        mathNumberNull,
        defineBlock(ListImmediateBlock),
        defineBlock(TimelineDateBlock),
        defineBlock(EnumSelectBlock),
    ]),
    defineCategory("%{BKY_NODES}", "nodes_category").asDynamicCategory(Nodes)
])