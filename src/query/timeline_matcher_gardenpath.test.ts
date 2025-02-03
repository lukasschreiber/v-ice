import * as ambient from "@/query/timeline_matcher"
import "@/window"
import { beforeAll, expect, test } from "vitest"
import weather from "@/assets/data/weather.json"
import { EventOp, SkipOp, TimeUnit, Timeline, TimelineTemplate } from "./generation/timeline_templates"
import { DataTable, TableSaveFile } from "@/data/table"
import { StructFields } from "@/data/types"

let weatherTable: DataTable

beforeAll(() => {
    weatherTable = DataTable.fromJSON(weather as unknown as TableSaveFile)
})

const template: TimelineTemplate = [
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
    { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
    { type_: "event", event: (e) => e["Niederschlag"] === true, op: EventOp.OCCURS },
]

test("Matching of 12 rain days in Leipzig, in a row", () => {
    // Leipzig starts at the first day
    const result = ambient.matchTimeline(template, ambient.preprocessTimeline(weatherTable.getRows().find(row => row["Stadt"] === "Leipzig")!["Wetterdaten"] as Timeline<StructFields>))

    expect(result).toBe(true)
})

// test("Match all cities with 12 rain days in a row", () => {
//     const cityCount = weatherTable.getRows().length
//     const matches = []
//     for (const city of weatherTable.getRows()) {
//         const result = ambient.matchTimeline(template, ambient.preprocessTimeline(city["Wetterdaten"] as Timeline<StructFields>))
//         if (result) {
//             matches.push(city["Stadt"])
//         }
//     }

//     console.log(matches)
//     console.log(matches.length, cityCount)
// })

// minimal exmaple for gardenpath situations

// const timeline: Timeline<StructFields> = [
//     { type: "a", timestamp: new Date("2021-01-01").toISOString() },
//     { type: "a", timestamp: new Date("2021-01-02").toISOString() },
//     { type: "b", timestamp: new Date("2021-01-03").toISOString() },
//     { type: "c", timestamp: new Date("2021-01-04").toISOString() },
//     { type: "a", timestamp: new Date("2021-01-05").toISOString() },
//     { type: "a", timestamp: new Date("2021-01-06").toISOString() },
//     { type: "a", timestamp: new Date("2021-01-07").toISOString() },
// ] as Timeline<Record<string, never>>

// const template2: TimelineTemplate = [
//     { type_: "event", event: (e) => e["type"] === "a", op: EventOp.OCCURS },
//     { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
//     { type_: "event", event: (e) => e["type"] === "a", op: EventOp.OCCURS },
//     { type_: "skip", op: SkipOp.EXACTLY, duration: 1, unit: TimeUnit.DAY },
//     { type_: "event", event: (e) => e["type"] === "a", op: EventOp.OCCURS },
// ]

// test("Matching of gardenpath situation", () => {
//     const result = ambient.matchTimeline(template2, timeline)

//     expect(result).toBe(true)
// })