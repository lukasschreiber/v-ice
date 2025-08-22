import { StructFields } from "@/data/types";
import { Timeline } from "@/query/generation/timeline_templates";
import { createPatternMatcher } from "../nfa";
import { Pattern } from "../dsl/patterns";
import { expect, test } from "vitest";
import { writeFileSync } from "fs";
import { IPatternBuilder, isPatternBuilder } from "../dsl/pattern_builder";

function getOutputFileName(name: string): string {
    return `test/nfa_visualization_${name.replace(/\s+/g, "_").toLowerCase()}.svg`;
}

export function testPatternMatcher(
    name: string,
    setup: { pattern: Pattern | IPatternBuilder; input: Timeline<StructFields>; correct: number[][] }
) {
    const pattern = isPatternBuilder(setup.pattern) ? setup.pattern.build() : setup.pattern;
    test(name, async () => {
        const matcher = createPatternMatcher(pattern);

        const result = matcher.match(setup.input);
        const expected = setup.correct.map((indices) =>
            indices.map((index) => ({ ...setup.input[index], index }))
        );
        
        const svg = await matcher.getNFAVisualization();
        writeFileSync(getOutputFileName(name), svg.outerHTML);
        
        expect(result).toEqual(expected);
    });
}
