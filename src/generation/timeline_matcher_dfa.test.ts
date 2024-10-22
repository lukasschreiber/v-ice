import * as ambient from "@/generation/timeline_matcher_dfa"
import "@/window"
import { beforeAll, expect, test } from "vitest"
import weather from "@/assets/data/weather.json"
import { DataTable, TableSaveFile } from "@/main"
import { EventOp, Timeline, TimelineTemplateEventMeta } from "./timeline_templates"
import { StructFields } from "@/data/types"
import { M } from "vite/dist/node/types.d-aGj9QkWt"

let weatherTable: DataTable

beforeAll(() => {
    weatherTable = DataTable.fromJSON(weather as TableSaveFile)
})

test("test", () => {
    const states = new Set<ambient.State>([0, 1, 2]);
    const transitions = new Map<ambient.State, Map<ambient.EventMatcher, ambient.State>>([
        [0, new Map<ambient.EventMatcher, ambient.State>([
            [(event) => event.type === 'start', 1]
        ])],
        [1, new Map<ambient.EventMatcher, ambient.State>([
            [(event) => event.type === 'process', 2]
        ])],
        [2, new Map<ambient.EventMatcher, ambient.State>([
            [(event) => event.type === 'end', 0]
        ])]
    ]);
    const startState: ambient.State = 0;
    const acceptStates = new Set<ambient.State>([0]);

    const eventDFA = new ambient.SimpleEventDFA(states, transitions, startState, acceptStates);

    const events: Timeline<StructFields> = [
        { type: 'start', timestamp: '2021-01-01T00:00:00Z' },
        { type: 'process', timestamp: '2021-01-01T00:00:01Z' },
        { type: 'end', timestamp: '2021-01-01T00:00:02Z' }
    ] as Timeline<Record<string, never>>;

    console.log(eventDFA.test(events));

    const dfa = ambient.buildDfa([
        {type_: "event", event: (event) => event.type === 'start', op: EventOp.OCCURS},
        {type_: "event", event: (event) => event.type === 'process', op: EventOp.OCCURS},
        {type_: "event", event: (event) => event.type === 'end', op: EventOp.OCCURS}
    ])

    console.log(dfa.test(events));
})

test("gardenpath test", () => {
    const dfa = ambient.buildDfa([
        {type_: "event", event: (event) => event.type === 'a', op: EventOp.OCCURS},
        {type_: "event", event: (event) => event.type === 'a', op: EventOp.OCCURS},
        {type_: "event", event: (event) => event.type === 'a', op: EventOp.OCCURS}
    ])

    console.log(dfa)

    console.log(dfa.test([
        {type: 'a', timestamp: '2021-01-01T00:00:00Z'},
        {type: 'a', timestamp: '2021-01-01T00:00:01Z'},
        {type: 'b', timestamp: '2021-01-01T00:00:02Z'},
        {type: 'a', timestamp: '2021-01-01T00:00:03Z'},
        {type: 'a', timestamp: '2021-01-01T00:00:04Z'},
        {type: 'a', timestamp: '2021-01-01T00:00:04Z'},
    ] as Timeline<Record<string, never>>))

    console.log(dfa.test([
        {type: 'a', timestamp: '2021-01-01T00:00:00Z'},
        {type: 'a', timestamp: '2021-01-01T00:00:01Z'},
        {type: 'a', timestamp: '2021-01-01T00:00:03Z'},
        {type: 'b', timestamp: '2021-01-01T00:00:02Z'},
        {type: 'a', timestamp: '2021-01-01T00:00:03Z'},
        {type: 'a', timestamp: '2021-01-01T00:00:04Z'},
        {type: 'a', timestamp: '2021-01-01T00:00:04Z'},
    ] as Timeline<Record<string, never>>))
})
