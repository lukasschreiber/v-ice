
import { expect, test } from "vitest"
import { EventOp, SkipOp, TimeUnit, Timeline, TimelineTemplate } from "./timeline_templates"
import ts from "typescript"
import ambientRaw from "@/generation/timeline_matcher?raw"
import * as ambient from "@/generation/timeline_matcher"
import "@/window"

test("ambient functions are defined and all exports are actually functions with unique names", () => {
    Object.entries(ambient).forEach(([name, fn]) => {
        expect(typeof fn).toBe("function")
        expect(fn.name).toBe(name)
    })

    const names = Object.keys(ambient)
    expect(new Set(names).size).toBe(names.length)
})

test("ambient functions do not have any dependencies", async () => {
    const output = ts.transpileModule(ambientRaw, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ESNext
        }
    })

    const source = output.outputText
    const dependencies = source.match(/^import\w|^require/gm)
    expect(dependencies).toBe(null)
})

const timeline = [
    { type: "a", timestamp: new Date("2021-01-01").toISOString() },
    { type: "b", timestamp: new Date("2021-01-02").toISOString() },
    { type: "c", timestamp: new Date("2021-01-03").toISOString() }
] as Timeline<Record<string, never>>

test("match timeline: event x occurs", () => {
    expect(ambient.matchTimeline([{ type_: "event", event: { type: "a" }, op: EventOp.OCCURS }], timeline)).toBe(true)
    expect(ambient.matchTimeline([{ type_: "event", event: { type: "b" }, op: EventOp.OCCURS }], timeline)).toBe(true)
    expect(ambient.matchTimeline([{ type_: "event", event: { type: "c" }, op: EventOp.OCCURS }], timeline)).toBe(true)
    expect(ambient.matchTimeline([{ type_: "event", event: { type: "d" }, op: EventOp.OCCURS }], timeline)).toBe(false)
})

test("match timeline: event x does not occur", () => {
    expect(ambient.matchTimeline([{ type_: "event", event: { type: "a" }, op: EventOp.DOES_NOT_OCCUR }], timeline)).toBe(false)
    expect(ambient.matchTimeline([{ type_: "event", event: { type: "b" }, op: EventOp.DOES_NOT_OCCUR }], timeline)).toBe(false)
    expect(ambient.matchTimeline([{ type_: "event", event: { type: "c" }, op: EventOp.DOES_NOT_OCCUR }], timeline)).toBe(false)
    expect(ambient.matchTimeline([{ type_: "event", event: { type: "d" }, op: EventOp.DOES_NOT_OCCUR }], timeline)).toBe(true)
})

test("match timeline: event x does not occur untils event y occurs", () => {
    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "b" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "d" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "d" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "c" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "event", event: { type: "d" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false) // TODO: not sure on the semantics here
})

test("match timeline: event x occurs and then event y occurs", () => {
    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
    ] as Timeline<Record<string, never>>)).toBe(true)
})

test("match timeline: event x occurs and then event y does not occur", () => {
    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.DOES_NOT_OCCUR }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "c" }, op: EventOp.DOES_NOT_OCCUR }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "c" }, op: EventOp.DOES_NOT_OCCUR }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "a" }, op: EventOp.DOES_NOT_OCCUR }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.DOES_NOT_OCCUR }
    ], timeline)).toBe(true)
})

test("match timeline: event x occurs then event y does not occur until event x occurs again", () => {
    const timeline = [
        { type: "c", timestamp: new Date("2021-01-01").toISOString() },
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "a", timestamp: new Date("2021-01-03").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "event", event: { type: "d" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "c" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)
})

test("match timeline: event x occurs three times", () => {
    const timeline = [
        { type: "c", timestamp: new Date("2021-01-01").toISOString() },
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "a", timestamp: new Date("2021-01-02").toISOString() },
        { type: "a", timestamp: new Date("2021-01-03").toISOString() },
        { type: "b", timestamp: new Date("2021-01-04").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "a" }, op: EventOp.DOES_NOT_OCCUR }
    ], timeline)).toBe(false)
})

test("match timeline: event x occurs then event y occurs for the first time", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "c", timestamp: new Date("2021-01-02").toISOString() },
        { type: "b", timestamp: new Date("2021-01-03").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.FIRST_OCCURRENCE }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "c" }, op: EventOp.FIRST_OCCURRENCE }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "c" }, op: EventOp.FIRST_OCCURRENCE }
    ], timeline)).toBe(true)
})

test("match timeline: event x occurs then event y occurs for the last time", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "c", timestamp: new Date("2021-01-02").toISOString() },
        { type: "b", timestamp: new Date("2021-01-03").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.LAST_OCCURRENCE }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "c" }, op: EventOp.LAST_OCCURRENCE }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "c" }, op: EventOp.LAST_OCCURRENCE }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "c" }, op: EventOp.LAST_OCCURRENCE },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.LAST_OCCURRENCE },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)
})

test("match timeline: event x occurs after the date y", () => {
    expect(ambient.matchTimeline([
        { type_: "date", timestamp: { timestamp: new Date("2021-01-01").toISOString() } },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "date", timestamp: { timestamp: new Date("2021-01-02").toISOString() } },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "date", timestamp: { timestamp: new Date("2021-01-01").toISOString() } },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "date", timestamp: { timestamp: new Date("2021-01-02").toISOString() } },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)
})

test("match timeline: event x occurs after the date y and before the date z", () => {
    expect(ambient.matchTimeline([
        { type_: "date", timestamp: { timestamp: new Date("2021-01-01").toISOString() } },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "date", timestamp: { timestamp: new Date("2021-01-02").toISOString() } }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "date", timestamp: { timestamp: new Date("2021-01-01").toISOString() } },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "date", timestamp: { timestamp: new Date("2021-01-03").toISOString() } }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "date", timestamp: { timestamp: new Date("2021-01-02").toISOString() } },
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "date", timestamp: { timestamp: new Date("2021-01-03").toISOString() } }
    ], timeline)).toBe(false)
})

test("match timeline: event y occurs n days after event x", () => {
    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "skip", duration: 2, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "skip", duration: 2, unit: TimeUnit.DAY, op: SkipOp.AT_LEAST },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "skip", duration: 1, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
        { type_: "skip", duration: 24, unit: TimeUnit.HOUR, op: SkipOp.AT_LEAST },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
    ], timeline)).toBe(true)
})

test("match timeline: event x does not occur until date y", () => {
    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "date", timestamp: { timestamp: new Date("2021-01-02").toISOString() } }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "b" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "date", timestamp: { timestamp: new Date("2021-01-04").toISOString() } }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "c" }, op: EventOp.DOES_NOT_OCCUR },
        { type_: "date", timestamp: { timestamp: new Date("2021-01-02").toISOString() } }
    ], timeline)).toBe(true)
})

test("match timeline: event x occurs n to m days after event y", () => {
    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "skip_interval", minDuration: 1, maxDuration: 2, unit: TimeUnit.DAY },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "skip_interval", minDuration: 1, maxDuration: 2, unit: TimeUnit.DAY },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "skip_interval", minDuration: 1, maxDuration: 24, unit: TimeUnit.HOUR },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "skip_interval", minDuration: 1, maxDuration: 24, unit: TimeUnit.HOUR },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)
})

test("match timeline: event x occurs and then event x does not occur for n days", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "c", timestamp: new Date("2021-01-03").toISOString() },
        { type: "a", timestamp: new Date("2021-01-04").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "no_event", duration: 1, unit: TimeUnit.DAY, event: { type: "a" } }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "no_event", duration: 5, unit: TimeUnit.DAY, event: { type: "a" } }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "no_event", duration: 2, unit: TimeUnit.DAY, event: { type: "a" } },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
    ], timeline)).toBe(true)
})

test("match timeline: event x occurs and then either event y or event z occurs", () => {
    const query: TimelineTemplate = [
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "options", options: [
                [{ type_: "event", event: { type: "b" }, op: EventOp.OCCURS }],
                [{ type_: "event", event: { type: "c" }, op: EventOp.OCCURS }]
            ]
        }
    ]

    expect(ambient.matchTimeline(query, [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() }
    ] as Timeline<Record<string, never>>)).toBe(true)

    expect(ambient.matchTimeline(query, [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "c", timestamp: new Date("2021-01-02").toISOString() }
    ] as Timeline<Record<string, never>>)).toBe(true)

    expect(ambient.matchTimeline(query, [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "d", timestamp: new Date("2021-01-02").toISOString() }
    ] as Timeline<Record<string, never>>)).toBe(false)

    const query2: TimelineTemplate = [
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "options", options: [
                [{ type_: "event", event: { type: "b" }, op: EventOp.OCCURS }],
                [{ type_: "event", event: { type: "c" }, op: EventOp.OCCURS }]
            ]
        },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ]

    expect(ambient.matchTimeline(query2, [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() }
    ] as Timeline<Record<string, never>>)).toBe(false)

    expect(ambient.matchTimeline(query2, [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "c", timestamp: new Date("2021-01-02").toISOString() }
    ] as Timeline<Record<string, never>>)).toBe(false)

    expect(ambient.matchTimeline(query2, [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "b", timestamp: new Date("2021-01-03").toISOString() }
    ] as Timeline<Record<string, never>>)).toBe(true)

    expect(ambient.matchTimeline(query2, [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "c", timestamp: new Date("2021-01-02").toISOString() },
        { type: "b", timestamp: new Date("2021-01-03").toISOString() }
    ] as Timeline<Record<string, never>>)).toBe(true)
})

test("match timeline: either or but with only skips", () => {
    const query: TimelineTemplate = [
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "options", options: [
                [{ type_: "skip", duration: 1, unit: TimeUnit.DAY, op: SkipOp.EXACTLY }],
                [{ type_: "skip", duration: 2, unit: TimeUnit.DAY, op: SkipOp.EXACTLY }]
            ]
        },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ]

    expect(ambient.matchTimeline(query, [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "c", timestamp: new Date("2021-01-02").toISOString() },
        { type: "b", timestamp: new Date("2021-01-03").toISOString() }
    ] as Timeline<Record<string, never>>)).toBe(true)

    expect(ambient.matchTimeline(query, [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "c", timestamp: new Date("2021-01-02").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() }
    ] as Timeline<Record<string, never>>)).toBe(true)

    expect(ambient.matchTimeline(query, [
        { type: "skip", timestamp: new Date("2021-01-01").toISOString() },
        { type: "skip", timestamp: new Date("2021-01-02").toISOString() },
        { type: "skip", timestamp: new Date("2021-01-06").toISOString() }
    ] as Timeline<Record<string, never>>)).toBe(false)
})

test("match timeline: event x occurs and then event y occurs n times", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "b", timestamp: new Date("2021-01-03").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() },
        { type: "b", timestamp: new Date("2021-01-04").toISOString() },
        { type: "c", timestamp: new Date("2021-01-05").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "loop_count", count: 3, template: [{ type_: "event", event: { type: "b" }, op: EventOp.OCCURS }] }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "loop_count", count: 4, template: [{ type_: "event", event: { type: "b" }, op: EventOp.OCCURS }] }
    ], timeline)).toBe(false)


    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
    ], timeline)).toBe(false)
})

test("match timeline: count loops can be nested", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() },
        { type: "b", timestamp: new Date("2021-01-05").toISOString() },
        { type: "b", timestamp: new Date("2021-01-05").toISOString() },
        { type: "c", timestamp: new Date("2021-01-07").toISOString() },
        { type: "b", timestamp: new Date("2021-01-08").toISOString() },
        { type: "b", timestamp: new Date("2021-01-08").toISOString() },
        { type: "c", timestamp: new Date("2021-01-10").toISOString() },
        { type: "d", timestamp: new Date("2021-01-11").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_count", count: 3, template: [
                {
                    type_: "loop_count", count: 2, template: [
                        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
                    ]
                },
                { type_: "skip", duration: 2, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
            ]
        }
    ], timeline)).toBe(true)
})


test("match timeline: event x occurs and then event y occurs every n days until event z occurs", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() },
        { type: "b", timestamp: new Date("2021-01-05").toISOString() },
        { type: "c", timestamp: new Date("2021-01-07").toISOString() },
        { type: "b", timestamp: new Date("2021-01-08").toISOString() },
        { type: "c", timestamp: new Date("2021-01-10").toISOString() },
        { type: "d", timestamp: new Date("2021-01-11").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_until", untilEvent: { type: "d" }, template: [
                { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
                { type_: "skip", duration: 2, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
            ]
        }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_until", untilEvent: { type: "d" }, template: [
                { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
                { type_: "skip", duration: 2, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
            ]
        },
        { type_: "event", event: { type: "d" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_until", untilEvent: { type: "d" }, template: [
                { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
                { type_: "skip", duration: 2, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
            ]
        },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)
})

test("match timeline: after in a until loop", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() },
        { type: "c", timestamp: new Date("2021-01-07").toISOString() },
        { type: "c", timestamp: new Date("2021-01-10").toISOString() },
        { type: "d", timestamp: new Date("2021-01-11").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_until", untilEvent: { type: "d" }, template: [
                { type_: "skip", duration: 3, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
            ]
        }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_until", untilEvent: { type: "d" }, template: [
                { type_: "skip", duration: 3, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
            ]
        },
        { type_: "event", event: { type: "d" }, op: EventOp.OCCURS }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_until", untilEvent: { type: "d" }, template: [
                { type_: "skip", duration: 4, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
            ]
        },
        { type_: "event", event: { type: "d" }, op: EventOp.OCCURS }
    ], timeline)).toBe(false)
})

test("match timeline: until loops with any timeline entries after the until event", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() },
        { type: "c", timestamp: new Date("2021-01-07").toISOString() },
        { type: "c", timestamp: new Date("2021-01-10").toISOString() },
        { type: "d", timestamp: new Date("2021-01-11").toISOString() },
        { type: "c", timestamp: new Date("2021-01-20").toISOString() },
        { type: "d", timestamp: new Date("2021-01-21").toISOString() },
        { type: "e", timestamp: new Date("2021-01-24").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_until", untilEvent: { type: "d" }, template: [
                { type_: "skip", duration: 3, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
            ]
        }
    ], timeline)).toBe(true)
})

test("match timeline: until loops can be nested", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() },
        { type: "c", timestamp: new Date("2021-01-07").toISOString() },
        { type: "c", timestamp: new Date("2021-01-10").toISOString() },
        { type: "d", timestamp: new Date("2021-01-11").toISOString() },
        { type: "c", timestamp: new Date("2021-01-14").toISOString() },
        { type: "c", timestamp: new Date("2021-01-17").toISOString() },
        { type: "c", timestamp: new Date("2021-01-20").toISOString() },
        { type: "d", timestamp: new Date("2021-01-21").toISOString() },
        { type: "e", timestamp: new Date("2021-01-24").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_until", untilEvent: { type: "e" }, template: [
                {
                    type_: "loop_until", untilEvent: { type: "d" }, template: [
                        { type_: "skip", duration: 3, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
                    ]
                }
            ]
        }
    ], timeline)).toBe(true)
})

test("match timeline: count loop inside until loop", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() },
        { type: "c", timestamp: new Date("2021-01-07").toISOString() },
        { type: "c", timestamp: new Date("2021-01-10").toISOString() },
        { type: "d", timestamp: new Date("2021-01-11").toISOString() },
        { type: "c", timestamp: new Date("2021-01-14").toISOString() },
        { type: "c", timestamp: new Date("2021-01-17").toISOString() },
        { type: "c", timestamp: new Date("2021-01-20").toISOString() },
        { type: "d", timestamp: new Date("2021-01-21").toISOString() },
        { type: "e", timestamp: new Date("2021-01-24").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_until", untilEvent: { type: "e" }, template: [
                {
                    type_: "loop_count", count: 3, template: [
                        { type_: "skip", duration: 3, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
                    ]
                },
                { type_: "event", event: { type: "d" }, op: EventOp.OCCURS }
            ]
        }
    ], timeline)).toBe(true)
})

test("match timeline: either or works with until loops", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2021-01-01").toISOString() },
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "c", timestamp: new Date("2021-01-04").toISOString() },
        { type: "c", timestamp: new Date("2021-01-07").toISOString() },
        { type: "c", timestamp: new Date("2021-01-10").toISOString() },
        { type: "d", timestamp: new Date("2021-01-11").toISOString() },
        { type: "c", timestamp: new Date("2021-01-14").toISOString() },
        { type: "c", timestamp: new Date("2021-01-17").toISOString() },
        { type: "c", timestamp: new Date("2021-01-20").toISOString() },
        { type: "d", timestamp: new Date("2021-01-21").toISOString() },
        { type: "e", timestamp: new Date("2021-01-24").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        {
            type_: "loop_until", untilEvent: { type: "e" }, template: [
                {
                    type_: "options", options: [
                        [
                            {
                                type_: "loop_count", count: 3, template: [
                                    { type_: "skip", duration: 3, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
                                    { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
                                ]
                            },
                            { type_: "event", event: { type: "d" }, op: EventOp.OCCURS }
                        ],
                        [
                            { type_: "event", event: { type: "c" }, op: EventOp.OCCURS },
                            { type_: "event", event: { type: "d" }, op: EventOp.OCCURS }
                        ]
                    ]
                }
            ]
        }
    ], timeline)).toBe(true)
})

test("timeline matcher: skip interval does the same thing as skip at least and skip at most", () => {
    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "skip_interval", minDuration: 1, maxDuration: 2, unit: TimeUnit.DAY },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], timeline)).toBe(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "skip", duration: 1, unit: TimeUnit.DAY, op: SkipOp.AT_LEAST },
        { type_: "skip", duration: 1, unit: TimeUnit.DAY, op: SkipOp.AT_MOST },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], timeline))

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "skip_interval", minDuration: 1, maxDuration: 2, unit: TimeUnit.DAY },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline)).toBe(ambient.matchTimeline([
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "skip", duration: 1, unit: TimeUnit.DAY, op: SkipOp.AT_LEAST },
        { type_: "skip", duration: 1, unit: TimeUnit.DAY, op: SkipOp.AT_MOST },
        { type_: "event", event: { type: "c" }, op: EventOp.OCCURS }
    ], timeline))
})

test("timeline matcher: event and then count loop is the same as count loop with n + 1", () => {
    const timeline = [
        { type: "a", timestamp: new Date("2020-01-01").toISOString() }, // way before
        { type: "b", timestamp: new Date("2021-01-02").toISOString() },
        { type: "b", timestamp: new Date("2021-01-03").toISOString() },
        { type: "b", timestamp: new Date("2021-01-04").toISOString() },
        { type: "b", timestamp: new Date("2021-01-05").toISOString() },
        { type: "b", timestamp: new Date("2021-01-06").toISOString() },
        { type: "c", timestamp: new Date("2021-01-07").toISOString() },
        { type: "b", timestamp: new Date("2021-01-09").toISOString() },
        { type: "c", timestamp: new Date("2021-01-10").toISOString() }
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "loop_count", count: 3, template: [
            { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
        ] }
    ], timeline)).toBe(true)

    expect(ambient.matchTimeline([
        { type_: "loop_count", count: 5, template: [
            { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
            { type_: "skip", duration: 1, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
        ] }
    ], timeline)).toBe(true)

    // this should fail because it does not start 1 day after the first event
    expect(ambient.matchTimeline([
        { type_: "loop_count", count: 5, template: [
            { type_: "skip", duration: 1, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
            { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        ] }
    ], timeline)).toBe(false)

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        { type_: "loop_count", count: 4, template: [
            { type_: "skip", duration: 1, unit: TimeUnit.DAY, op: SkipOp.EXACTLY },
            { type_: "event", event: { type: "b" }, op: EventOp.OCCURS },
        ] }
    ], timeline)).toBe(true)
})

test("timeline matcher: interval starts works", () => {
    const timeline = [
        { type: "a", start: new Date("2021-01-01").toISOString(), end: new Date("2021-01-02").toISOString() },
        { type: "b", start: new Date("2021-01-02").toISOString(), end: new Date("2021-01-03").toISOString() },
        { type: "c", start: new Date("2021-01-03").toISOString(), end: new Date("2021-01-04").toISOString() },
        { type: "d", start: new Date("2021-01-04").toISOString(), end: new Date("2021-01-05").toISOString() },
        { type: "e", start: new Date("2021-01-05").toISOString(), end: new Date("2021-01-06").toISOString() },
    ] as Timeline<Record<string, never>>

    expect(ambient.matchTimeline([
        { type_: "event", event: { type: "a" }, op: EventOp.OCCURS },
        { type_: "interval", limit: "start", op: EventOp.OCCURS, event: { type: "b" } },
        { type_: "event", event: { type: "b" }, op: EventOp.OCCURS }
    ], ambient.preprocessTimeline(timeline))).toBe(true)
})