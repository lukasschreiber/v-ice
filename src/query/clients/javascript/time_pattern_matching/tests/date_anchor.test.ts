import { describe } from "vitest";
import { buildPattern } from "../dsl/pattern_builder";
import { testPatternMatcher } from "./utils";
import { DateTimeGranularity } from "@/utils/datetime";

describe("NFA Simulation Tests for Sequences with date anchors", () => {
    testPatternMatcher("Date anchor at start", {
        pattern: buildPattern()
            .sequence(
                buildPattern().dateAnchor({ timestamp: "2023-01-05T00:00:00Z" }).build(),
                buildPattern()
                    .event((b) => b.matches((e) => e.type === "a"))
                    .build()
            )
            .build(),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T00:00:01Z" },
            { type: "a", timestamp: "2023-01-07T00:00:00Z" },
        ],
        correct: [[2]],
    });

    testPatternMatcher("Date anchor in middle", {
        pattern: buildPattern()
            .sequence(
                buildPattern()
                    .event((b) => b.matches((e) => e.type === "a"))
                    .build(),
                buildPattern().dateAnchor({ timestamp: "2023-01-05T00:00:00Z" }).build(),
                buildPattern()
                    .event((b) => b.matches((e) => e.type === "b"))
                    .build()
            )
            .build(),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-01T00:00:01Z" },
            { type: "a", timestamp: "2023-01-05T00:00:00Z" },
            { type: "b", timestamp: "2023-01-07T00:00:00Z" },
        ],
        correct: [[0, 3]],
    });

    testPatternMatcher("Date anchor with interval", {
        pattern: buildPattern()
            .sequence(
                buildPattern()
                    .event((b) => b.matches((e) => e.type === "a"))
                    .build(),
                buildPattern().dateAnchor({ timestamp: "2023-01-05T00:00:00Z" }).build(),
                buildPattern()
                    .event((b) =>
                        b.matches((e) => e.type === "b").interval({ min: 1, max: 3, unit: DateTimeGranularity.DAY })
                    )
                    .build()
            )
            .build(),
        input: [
            { type: "a", timestamp: "2023-01-01T00:00:00Z" },
            { type: "b", timestamp: "2023-01-04T00:00:00Z" },
            { type: "a", timestamp: "2023-01-05T00:00:00Z" },
            { type: "b", timestamp: "2023-01-06T00:00:00Z" },
            { type: "b", timestamp: "2023-01-18T00:00:00Z" },
        ],
        correct: [
            [2, 3],
            [2, 4],
        ],
    });
});
