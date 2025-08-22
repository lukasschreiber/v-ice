import { describe, expect, test } from "vitest";
import { testPatternMatcher } from "./utils";
import { createPatternMatcher } from "../nfa";
import { P } from "../dsl/pattern_builder";

describe("NFA Simulation Tests for Sequences", () => {
    const pattern = P.seq(
        P.event((e) => e.type === "a"),
        P.event((e) => e.type === "b"),
    );

    testPatternMatcher("Sequantial events", {
        pattern,
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T00:00:01Z" },
            { type: "c", timestamp: "2023-01-01T00:00:02Z" },
        ],
        correct: [[0, 1]],
    });

    testPatternMatcher("Events inbetween", {
        pattern,
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "c", timestamp: "2023-01-01T00:00:01Z" },
            { type: "b", timestamp: "2023-01-01T00:00:02Z" },
        ],
        correct: [[0, 2]],
    });

    testPatternMatcher("No match", {
        pattern,
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "c", timestamp: "2023-01-01T00:00:01Z" },
        ],
        correct: [],
    });

    testPatternMatcher("Multiple matches", {
        pattern,
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T00:00:01Z" },
            { type: "a", timestamp: "2023-01-01T00:00:02Z" },
            { type: "b", timestamp: "2023-01-01T00:00:03Z" },
        ],
        correct: [
            [0, 1],
            [0, 3], // a before b
            [2, 3],
        ],
    });

    testPatternMatcher("Empty input", {
        pattern,
        input: [],
        correct: [],
    });

    testPatternMatcher("No events matching", {
        pattern,
        input: [
            { type: "c", timestamp: "2023-01-01T00:00:00Z" },
            { type: "d", timestamp: "2023-01-01T00:00:01Z" },
        ],
        correct: [],
    });

    testPatternMatcher("Pattern longer than input", {
        pattern,
        input: [{ type: "a", timestamp: "2023-01-01T00:00:00Z" }],
        correct: [],
    });

    test("Empty pattern", () => {
        const emptyPattern = P.empty();

        expect(() => {
            const matcher = createPatternMatcher(emptyPattern);
            matcher.match([{ type: "a", timestamp: "2023-01-01T00:00:00Z" }]);
        }).toThrowError();
    });

    testPatternMatcher("Sequence not starting with first event", {
        pattern,
        input: [
            { type: "b", timestamp: "2023-01-01T00:00:00Z" },
            { type: "a", timestamp: "2023-01-01T00:00:01Z" },
            { type: "b", timestamp: "2023-01-01T00:00:02Z" },
        ],
        correct: [[1, 2]], // Should match the second a and b
    });
});
