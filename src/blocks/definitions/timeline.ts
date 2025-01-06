import { ConnectionType, registerBlocksFromJsonArray } from "../block_definitions";
import types from "@/data/types";
import { Colors } from "@/themes/colors";
import { Blocks } from "@/blocks";
import { EventOp, SkipOp, TimeUnit } from "@/query/generation/timeline_templates";

export default registerBlocksFromJsonArray([
    {
        id: Blocks.Names.TIMELINE.QUERY,
        message0: "%{BKY_TIMELINE_MATCHES}",
        message1: "%1",
        args0: [
            {
                type: "input_value",
                name: "TIMELINE",
                check: types.timeline(types.union(types.event(types.enum(types.wildcard)), types.interval(types.enum(types.wildcard))))
            }
        ],
        args1: [
            {
                type: "input_statement",
                name: "QUERY",
                check: ConnectionType.TIMELINE_PROTOTYPE
            }
        ],
        previousStatement: ConnectionType.BOOLEAN,
        nextStatement: ConnectionType.BOOLEAN,
        helpUrl: "#timeline-match",
        colour: Colors.categories.history,
    },
    {
        id: Blocks.Names.TIMELINE.EVENT_OCCURS,
        message0: "%{BKY_EVENT} %1 %2",
        args0: [
            {
                type: "input_value",
                name: "EVENT",
                check: types.event(types.enum(types.wildcard))
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
        ],
        previousStatement: ConnectionType.TIMELINE_PROTOTYPE,
        nextStatement: ConnectionType.TIMELINE_PROTOTYPE,
        extensions: ["dynamic_event"],
        colour: Colors.categories.history,
        helpUrl: "#timeline-event",
        mutator: "event_does_not_occur_for_mutator"
    },
    {
        id: Blocks.Names.TIMELINE.EVENT_OCCURS_MATCH,
        message0: "%1 %2 %3",
        message1: "%1",
        args0: [
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
        ],
        args1: [
            {
                type: "input_statement",
                name: "QUERY",
                check: ConnectionType.BOOLEAN
            }
        ],
        previousStatement: ConnectionType.TIMELINE_PROTOTYPE,
        nextStatement: ConnectionType.TIMELINE_PROTOTYPE,
        extensions: ["dynamic_event_matches"],
        colour: Colors.categories.history,
        helpUrl: "#timeline-event-query",
        mutator: "event_does_not_occur_for_mutator"
    },
    {
        id: Blocks.Names.TIMELINE.START_OF_INTERVAL,
        message0: "%{BKY_START} %{BKY_OF} %1",
        args0: [
            {
                type: "input_value",
                name: "INTERVAL",
                check: types.interval(types.enum(types.wildcard))
            }
        ],
        output: types.event(types.enum(types.wildcard)),
        helpUrl: "#timeline-interval",
        colour: Colors.categories.history,
    },
    {
        id: Blocks.Names.TIMELINE.END_OF_INTERVAL,
        message0: "%{BKY_END} %{BKY_OF} %1",
        args0: [
            {
                type: "input_value",
                name: "INTERVAL",
                check:  types.interval(types.enum(types.wildcard))
            }
        ],
        output: types.event(types.enum(types.wildcard)),
        helpUrl: "#timeline-interval",
        colour: Colors.categories.history,
    },
    {
        id: Blocks.Names.TIMELINE.AFTER,
        message0: "%{BKY_AFTER} %1 %2 %3",
        args0: [
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
        ],
        previousStatement: ConnectionType.TIMELINE_PROTOTYPE,
        nextStatement: ConnectionType.TIMELINE_PROTOTYPE,
        helpUrl: "#timeline-after",
        colour: Colors.categories.history,
    },
    {
        id: Blocks.Names.TIMELINE.AFTER_INTERVAL,
        message0: "%{BKY_AFTER} %1 %{BKY_TO} %2 %3",
        args0: [
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
        ],
        previousStatement: ConnectionType.TIMELINE_PROTOTYPE,
        nextStatement: ConnectionType.TIMELINE_PROTOTYPE,
        helpUrl: "#timeline-after-interval",
        colour: Colors.categories.history,
    },
    {
        id: Blocks.Names.TIMELINE.TIMESTAMP,
        message0: "%{BKY_THE_DATE_IS}",
        args0: [
            {
                type: "input_value",
                name: "TIMESTAMP",
                check: types.timestamp
            }
        ],
        previousStatement: ConnectionType.TIMELINE_PROTOTYPE,
        nextStatement: ConnectionType.TIMELINE_PROTOTYPE,
        helpUrl: "#timeline-timestamp",
        colour: Colors.categories.history,
    },
    {
        id: Blocks.Names.TIMELINE.DATE_PICKER,
        message0: "%1",
        args0: [
            {
                type: "field_datetime",
                name: "TIMESTAMP",
            },
        ],
        output: types.timestamp,
        colour: Colors.categories.history,
        extensions: ["parent_color"],
    },
    {
        id: Blocks.Names.TIMELINE.EVENT_PICKER,
        message0: "%1",
        args0: [
            {
                type: "field_dynamic_dropdown",
                name: 'EVENT',
                options: [
                    ["", ""],
                ],
            }
        ],
        output: types.event(types.enum(types.wildcard)),
        colour: Colors.categories.history,
        mutator: "event_select_mutator"
    },
    {
        id: Blocks.Names.TIMELINE.EITHER_OR,
        message0: "%{BKY_EITHER}",
        message1: "%1",
        message2: "%{BKY_OR}",
        message3: "%1",
        args1: [
            {
                type: "input_statement",
                name: "A",
                check: ConnectionType.TIMELINE_PROTOTYPE
            },
        ],
        args3: [
            {
                type: "input_statement",
                name: "B",
                check: ConnectionType.TIMELINE_PROTOTYPE
            },
        ],
        previousStatement: ConnectionType.TIMELINE_PROTOTYPE,
        nextStatement: ConnectionType.TIMELINE_PROTOTYPE,
        colour: Colors.categories.history,
        helpUrl: "#timeline-or",
        mutator: "either_or_mutator",
    },
    {
        id: Blocks.Names.TIMELINE.LOOP_UNTIL,
        message0: "%{BKY_REPEAT_UNTIL}",
        args0: [
            {
                type: "input_value",
                name: "EVENT",
                check: types.event(types.enum(types.wildcard))
            }
        ],
        message1: "%1",
        args1: [
            {
                type: "input_statement",
                name: "TEMPLATE",
                check: ConnectionType.TIMELINE_PROTOTYPE
            }
        ],
        previousStatement: ConnectionType.TIMELINE_PROTOTYPE,
        nextStatement: ConnectionType.TIMELINE_PROTOTYPE,
        extensions: ["dynamic_event"],
        helpUrl: "#timeline-repeat-until",
        colour: Colors.categories.history,
    },
    {
        id: Blocks.Names.TIMELINE.LOOP_COUNT,
        message0: "%{BKY_REPEAT_FOR}",
        args0: [
            {
                type: "input_value",
                name: "NUM",
                check: types.number
            }
        ],
        message1: "%1",
        args1: [
            {
                type: "input_statement",
                name: "TEMPLATE",
                check: ConnectionType.TIMELINE_PROTOTYPE
            }
        ],
        previousStatement: ConnectionType.TIMELINE_PROTOTYPE,
        nextStatement: ConnectionType.TIMELINE_PROTOTYPE,
        helpUrl: "#timeline-repeat",
        colour: Colors.categories.history,
    }
] as const)