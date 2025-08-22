import { describe } from "vitest";
import { DateTimeGranularity } from "@/utils/datetime";
import { testPatternMatcher } from "./utils";
import { P } from "../dsl/pattern_builder";

describe("NFA Simulation Tests for Sequences with intervals between events", () => {
    const daysPattern = P.seq(
        P.event((e) => e.type === "a"),
        P.event((e) => e.type === "b").intervalRange(5, 10, DateTimeGranularity.DAY)
    );

    testPatternMatcher("Basic day interval sequence", {
        pattern: daysPattern,
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-07T00:00:00Z" },
        ],
        correct: [[0, 1]],
    });

    testPatternMatcher("Day interval sequence with no match", {
        pattern: daysPattern,
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-02T00:00:00Z" },
        ],
        correct: [],
    });

    testPatternMatcher("Multiple occurrences with day intervals", {
        pattern: daysPattern,
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-07T00:00:00Z" },
            { type: "a", timestamp: "2023-01-10T00:00:00Z" },
            { type: "b", timestamp: "2023-01-15T00:00:00Z" },
        ],
        correct: [
            [0, 1],
            [2, 3],
        ],
    });

    testPatternMatcher("Hour interval sequence", {
        pattern: P.seq(
            P.event((e) => e.type === "a"),
            P.event((e) => e.type === "b").intervalRange(1, 3, DateTimeGranularity.HOUR)
        ),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T03:00:00Z" },
            { type: "b", timestamp: "2023-01-01T08:00:00Z" },
        ],
        correct: [[0, 1]],
    });

    testPatternMatcher("No maximum", {
        pattern: P.seq(
            P.event((e) => e.type === "a"),
            P.event((e) => e.type === "b").intervalMax(1, DateTimeGranularity.HOUR)
        ), 
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T01:00:00Z" },
            { type: "b", timestamp: "2023-01-01T02:00:00Z" },
        ],
        correct: [[0, 1]], // We only match the first one, the second one would be correct too, but we chose not to branch but keep the runtime simple. That works great if we only care about any match
    });
});
