import { describe } from "vitest";
import { testPatternMatcher } from "./utils";
import { P } from "../dsl/pattern_builder";

describe("NFA Simulation Tests for Sequences with Repeating sections", () => {
    testPatternMatcher("Repeat a single event", {
        pattern: P.seq(
            P.repeat(P.event((e) => e.type === "a")).min(3).max(10), // Repeat 'a' between 3 and 10 times
            P.event((e) => e.type === "b")
        ),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "a", timestamp: "2023-01-01T00:00:01Z" },
            { type: "a", timestamp: "2023-01-01T00:00:02Z" },
            { type: "b", timestamp: "2023-01-01T00:00:03Z" },
        ],
        correct: [
            [0, 1, 2, 3], // Matches all three 'a's followed by 'b'
        ],
    });
});
