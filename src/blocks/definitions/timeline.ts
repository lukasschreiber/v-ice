import { ConnectionType, createBlock } from "../block_definitions";
import types from "@/data/types";
import { Colors } from "@/themes/colors";
import { Blocks } from "@/blocks";
import { EventOp, SkipOp, TimeUnit } from "@/query/generation/timeline_templates";
import { DynamicEventExtension } from "../extensions/dynamic_event";
import { DynamicEventMatchesExtension } from "../extensions/dynamic_event_matches";
import { ParentColorExtension } from "../extensions/parent_color";
import { EitherOrMutator } from "../mutators/either_or";
import { EventDoesNotOccurForMutator } from "../mutators/event_does_not_occur_for";

export const TimelineQueryBlock = createBlock({
    id: Blocks.Names.TIMELINE.QUERY,
    lines: [
        {
            text: "%{BKY_TIMELINE_MATCHES}",
            args: [
                {
                    type: "input_value",
                    name: "TIMELINE",
                    check: types.timeline(types.union(types.event(types.enum(types.wildcard)), types.interval(types.enum(types.wildcard))))
                }
            ]
        },
        {
            text: "%1",
            args: [
                {
                    type: "input_statement",
                    name: "QUERY",
                    check: ConnectionType.TIMELINE_PROTOTYPE
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    helpUrl: "#timeline-match",
    color: Colors.categories.history,
})

export const TimelineEventOccursBlock = createBlock({
    id: Blocks.Names.TIMELINE.EVENT_OCCURS,
    lines: [
        {
            text: "%{BKY_EVENT} %1",
            args: [
                {
                    type: "field_dropdown",
                    name: "OP",
                    options: [
                        ["%{BKY_OCCURS}", EventOp.OCCURS],
                        ["%{BKY_DOES_NOT_OCCUR}", EventOp.DOES_NOT_OCCUR],
                        ["%{BKY_DOES_NOT_OCCUR_FOR}", EventOp.DOES_NOT_OCCUR_FOR],
                        ["%{BKY_OCCURS_FOR_THE_FIRST_TIME}", EventOp.FIRST_OCCURRENCE],
                        ["%{BKY_OCCURS_FOR_THE_LAST_TIME}", EventOp.LAST_OCCURRENCE]
                    ]
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.TIMELINE_PROTOTYPE,
    color: Colors.categories.history,
    helpUrl: "#timeline-event",
    extensions: [DynamicEventExtension],
    mutator: EventDoesNotOccurForMutator
})

export const TimelineEventOccursMatchBlock = createBlock({
    id: Blocks.Names.TIMELINE.EVENT_OCCURS_MATCH,
    lines: [
        {
            text: "%1 %2 %3",
            args: [
                {
                    type: "field_dropdown",
                    name: "SUBJECT",
                    options: [
                        ["%{BKY_EVENT}", "EVENT"],
                        ["%{BKY_START_OF_INTERVAL}", "START"],
                        ["%{BKY_END_OF_INTERVAL}", "END"]
                    ]
                },
                {
                    type: "field_local_variable",
                    name: "VALUE",
                    text: "%{BKY_EVENT}",
                    shapeType: types.event(types.enum(types.wildcard))
                },
                {
                    type: "field_dropdown",
                    name: "OP",
                    options: [
                        ["%{BKY_OCCURS}", EventOp.OCCURS],
                        ["%{BKY_DOES_NOT_OCCUR}", EventOp.DOES_NOT_OCCUR],
                        ["%{BKY_DOES_NOT_OCCUR_FOR}", EventOp.DOES_NOT_OCCUR_FOR],
                        ["%{BKY_OCCURS_FOR_THE_FIRST_TIME}", EventOp.FIRST_OCCURRENCE],
                        ["%{BKY_OCCURS_FOR_THE_LAST_TIME}", EventOp.LAST_OCCURRENCE]
                    ]
                }
            ]
        },
        {
            text: "%1",
            args: [
                {
                    type: "input_statement",
                    name: "QUERY",
                    check: ConnectionType.BOOLEAN
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.TIMELINE_PROTOTYPE,
    extensions: [DynamicEventMatchesExtension],
    color: Colors.categories.history,
    helpUrl: "#timeline-event-query",
    mutator: EventDoesNotOccurForMutator
})

export const TimelineStartOfIntervalBlock = createBlock({
    id: Blocks.Names.TIMELINE.START_OF_INTERVAL,
    lines: [
        {
            text: "%{BKY_START} %{BKY_OF} %1",
            args: [
                {
                    type: "input_value",
                    name: "INTERVAL",
                    check: types.interval(types.enum(types.wildcard))
                }
            ]
        }
    ] as const,
    output: types.event(types.enum(types.wildcard)),
    helpUrl: "#timeline-interval",
    color: Colors.categories.history,
})

export const TimelineEndOfIntervalBlock = createBlock({
    id: Blocks.Names.TIMELINE.END_OF_INTERVAL,
    lines: [
        {
            text: "%{BKY_END} %{BKY_OF} %1",
            args: [
                {
                    type: "input_value",
                    name: "INTERVAL",
                    check: types.interval(types.enum(types.wildcard))
                }
            ]
        }
    ] as const,
    output: types.event(types.enum(types.wildcard)),
    helpUrl: "#timeline-interval",
    color: Colors.categories.history,
})

export const TimelineAfterBlock = createBlock({
    id: Blocks.Names.TIMELINE.AFTER,
    lines: [
        {
            text: "%{BKY_AFTER} %1 %2 %3",
            args: [
                {
                    type: "field_dropdown",
                    name: "OP",
                    options: [
                        ["%{BKY_EXACTLY}", SkipOp.EXACTLY],
                        ["%{BKY_AT_LEAST}", SkipOp.AT_LEAST],
                        ["%{BKY_AT_MOST}", SkipOp.AT_MOST]
                    ]
                },
                {
                    type: "input_value",
                    name: "NUM",
                    check: types.number
                },
                {
                    type: "field_dropdown",
                    name: "UNIT",
                    options: [
                        ["%{BKY_SECONDS}", TimeUnit.SECOND],
                        ["%{BKY_MINUTES}", TimeUnit.MINUTE],
                        ["%{BKY_HOURS}", TimeUnit.HOUR],
                        ["%{BKY_DAYS}", TimeUnit.DAY],
                        ["%{BKY_WEEKS}", TimeUnit.WEEK],
                        ["%{BKY_MONTHS}", TimeUnit.MONTH],
                        ["%{BKY_YEARS}", TimeUnit.YEAR]
                    ]
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.TIMELINE_PROTOTYPE,
    helpUrl: "#timeline-after",
    color: Colors.categories.history,
})

export const TimelineAfterIntervalBlock = createBlock({
    id: Blocks.Names.TIMELINE.AFTER_INTERVAL,
    lines: [
        {
            text: "%{BKY_AFTER} %1 %{BKY_TO} %2 %3",
            args: [
                {
                    type: "input_value",
                    name: "START",
                    check: types.number
                },
                {
                    type: "input_value",
                    name: "END",
                    check: types.number
                },
                {
                    type: "field_dropdown",
                    name: "UNIT",
                    options: [
                        ["%{BKY_SECONDS}", TimeUnit.SECOND],
                        ["%{BKY_MINUTES}", TimeUnit.MINUTE],
                        ["%{BKY_HOURS}", TimeUnit.HOUR],
                        ["%{BKY_DAYS}", TimeUnit.DAY],
                        ["%{BKY_WEEKS}", TimeUnit.WEEK],
                        ["%{BKY_MONTHS}", TimeUnit.MONTH],
                        ["%{BKY_YEARS}", TimeUnit.YEAR]
                    ]
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.TIMELINE_PROTOTYPE,
    helpUrl: "#timeline-after-interval",
    color: Colors.categories.history,
})

export const TimestampBlock = createBlock({
    id: Blocks.Names.TIMELINE.TIMESTAMP,
    lines: [
        {
            text: "%{BKY_THE_DATE_IS}",
            args: [
                {
                    type: "input_value",
                    name: "TIMESTAMP",
                    check: types.timestamp
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.TIMELINE_PROTOTYPE,
    helpUrl: "#timeline-timestamp",
    color: Colors.categories.history,
})

export const TimelineDateBlock = createBlock({
    id: Blocks.Names.TIMELINE.DATE_PICKER,
    lines: [
        {
            text: "%1",
            args: [
                {
                    type: "field_datetime",
                    name: "TIMESTAMP",
                }
            ]
        }
    ] as const,
    output: types.timestamp,
    color: Colors.categories.history,
    extensions: [ParentColorExtension],
})

export const TimelineOrBlock = createBlock({
    id: Blocks.Names.TIMELINE.EITHER_OR,
    lines: [
        {
            text: "%{BKY_EITHER}",
            args: []
        },
        {
            text: "%1",
            args: [
                {
                    type: "input_statement",
                    name: "A",
                    check: ConnectionType.TIMELINE_PROTOTYPE
                }
            ]
        },
        {
            text: "%{BKY_OR}",
            args: []
        },
        {
            text: "%1",
            args: [
                {
                    type: "input_statement",
                    name: "B",
                    check: ConnectionType.TIMELINE_PROTOTYPE
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.TIMELINE_PROTOTYPE,
    color: Colors.categories.history,
    helpUrl: "#timeline-or",
    mutator: EitherOrMutator,
})

export const TimelineUntilBlock = createBlock({
    id: Blocks.Names.TIMELINE.LOOP_UNTIL,
    lines: [
        {
            text: "%{BKY_REPEAT_UNTIL}",
            args: [
                {
                    type: "input_value",
                    name: "EVENT",
                    check: types.event(types.enum(types.wildcard))
                }
            ]
        },
        {
            text: "%1",
            args: [
                {
                    type: "input_statement",
                    name: "TEMPLATE",
                    check: ConnectionType.TIMELINE_PROTOTYPE
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.TIMELINE_PROTOTYPE,
    extensions: [DynamicEventExtension],
    helpUrl: "#timeline-repeat-until",
    color: Colors.categories.history,
})

export const TimelineRepeatBlock = createBlock({
    id: Blocks.Names.TIMELINE.LOOP_COUNT,
    lines: [
        {
            text: "%{BKY_REPEAT_FOR}",
            args: [
                {
                    type: "input_value",
                    name: "NUM",
                    check: types.number
                }
            ]
        },
        {
            text: "%1",
            args: [
                {
                    type: "input_statement",
                    name: "TEMPLATE",
                    check: ConnectionType.TIMELINE_PROTOTYPE
                }
            ]
        }
    ] as const,
    connectionType: ConnectionType.TIMELINE_PROTOTYPE,
    helpUrl: "#timeline-repeat",
    color: Colors.categories.history,
})
