import { describe } from "vitest";
import { testPatternMatcher } from "./utils";
import { P } from "../dsl/pattern_builder";

describe("NFA Simulation Tests for Sequences with Choices", () => {
    testPatternMatcher("Choice with two events", {
        pattern: P.seq(
            P.choice(
                P.event((e) => e.type === "a"),
                P.event((e) => e.type === "b")
            ),
            P.event((e) => e.type === "c")
        ),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T00:00:01Z" },
            { type: "c", timestamp: "2023-01-01T00:00:02Z" },
        ],
        correct: [
            [0, 2],
            [1, 2],
        ], // Matches both choices
    });
});
