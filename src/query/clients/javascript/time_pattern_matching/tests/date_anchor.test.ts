import { describe } from "vitest";
import { testPatternMatcher } from "./utils";
import { DateTimeGranularity } from "@/utils/datetime";
import { P } from "../dsl/pattern_builder";

describe("NFA Simulation Tests for Sequences with date anchors", () => {
    testPatternMatcher("Date anchor at start", {
        pattern: P.seq(
            P.date({ timestamp: "2023-01-05T00:00:00Z" }),
            P.event(e => e.type === "a")
        ),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T00:00:01Z" },
            { type: "a", timestamp: "2023-01-07T00:00:00Z" },
        ],
        correct: [[2]],
    });

    testPatternMatcher("Date anchor in middle", {
        pattern: P.seq(
            P.event(e => e.type === "a"),
            P.date({ timestamp: "2023-01-05T00:00:00Z" }),
            P.event(e => e.type === "b")
        ),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T00:00:01Z" },
            { type: "a", timestamp: "2023-01-05T00:00:00Z" },
            { type: "b", timestamp: "2023-01-07T00:00:00Z" },
        ],
        correct: [[0, 3]],
    });

    testPatternMatcher("Date anchor with interval", {
        pattern: P.seq(
            P.event(e => e.type === "a"),
            P.date({ timestamp: "2023-01-05T00:00:00Z" }),
            P.event(e => e.type === "b").intervalRange(1, 3, DateTimeGranularity.DAY)
        ),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-04T00:00:00Z" },
            { type: "a", timestamp: "2023-01-05T00:00:00Z" },
            { type: "b", timestamp: "2023-01-06T00:00:00Z" },
            { type: "b", timestamp: "2023-01-18T00:00:00Z" },
        ],
        correct: [
            [0, 3],
        ],
    });
});
