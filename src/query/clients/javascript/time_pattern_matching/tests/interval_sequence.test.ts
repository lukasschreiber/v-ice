import { describe } from "vitest";
import { buildPattern } from "../dsl/pattern_builder";
import { DateTimeGranularity } from "@/utils/datetime";
import { testPatternMatcher } from "./utils";

describe("NFA Simulation Tests for Sequences with intervals between events", () => {
    const daysPattern = buildPattern()
        .sequence(
            buildPattern()
                .event((b) => b.matches((e) => e.type === "a"))
                .build(),
            buildPattern()
                .event((b) =>
                    b.matches((e) => e.type === "b").interval({ max: 10, min: 5, unit: DateTimeGranularity.DAY })
                )
                .build()
        )
        .build();

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
        pattern: buildPattern()
            .sequence(
                buildPattern()
                    .event((b) => b.matches((e) => e.type === "a"))
                    .build(),
                buildPattern()
                    .event((b) =>
                        b.matches((e) => e.type === "b").interval({ max: 3, min: 1, unit: DateTimeGranularity.HOUR })
                    )
                    .build()
            )
            .build(),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T03:00:00Z" },
            { type: "b", timestamp: "2023-01-01T08:00:00Z" },
        ],
        correct: [[0, 1]],
    });

    testPatternMatcher("No maximum", {
        pattern: buildPattern()
            .sequence(
                buildPattern()
                    .event((b) => b.matches((e) => e.type === "a"))
                    .build(),
                buildPattern()
                    .event((b) => b.matches((e) => e.type === "b").interval({ max: 1, unit: DateTimeGranularity.HOUR }))
                    .build()
            )
            .build(),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T01:00:00Z" },
            { type: "b", timestamp: "2023-01-01T02:00:00Z" },
        ],
        correct: [[0, 1]], // We only match the first one, the second one would be correct too, but we chose not to branch but keep the runtime simple. That works great if we only care about any match
    });
});
