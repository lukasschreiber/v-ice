import { StructFields } from "@/data/types";
import { TimelineEntry } from "@/query/generation/timeline_templates";
// @ts-ignore
import * as Viz from "@viz-js/viz";
import {
    ChoicePattern,
    DateAnchorPattern,
    EventOccurence,
    EventPattern,
    Pattern,
    RelativeInterval,
    RepeatPattern,
    SequencePattern,
} from "./dsl/patterns";
import { compareDates } from "../ambient/datetime";
import { matchTimeline, Path, TimelineEntryWithIndex } from "./nfa_simulation";

export interface NFAState<T extends StructFields = StructFields> {
    id: number;
    transitions: NFATransition<T>[];
    isAccepting: boolean;
}

export interface NFATransition<T extends StructFields = StructFields> {
    match?: (event: TimelineEntry<T>) => boolean; // undefined → epsilon
    skipIf?: (event: TimelineEntry<T>) => boolean; // skip if this condition is true
    labels?: string[]; // labels for visualization
    next: NFAState<T>;
    interval?: RelativeInterval;
    occurrence?: EventOccurence;
    onTransition?: (path: Path<StructFields>, event: TimelineEntry<T>) => void; // callback when this transition is taken
}

export class PatternMatcher<T extends StructFields = StructFields> {
    private stateIdCounter: { value: number } = { value: 0 };
    private startState: NFAState<T>;
    private pattern: Pattern;

    constructor(pattern: Pattern) {
        this.pattern = pattern;
        const [start, end] = patternToNFA(pattern, this.stateIdCounter);
        // Only the outermost final state is accepting
        end.isAccepting = true;
        this.startState = start;
    }

    getPattern(): Pattern {
        return this.pattern;
    }

    getNFA(): NFAState<T> {
        return this.startState;
    }

    match(timeline: TimelineEntry<T>[]): TimelineEntry<T>[][] {
        const indexedTimeline: TimelineEntryWithIndex<T>[] = timeline.map((entry, index) => ({ ...entry, index }));
        return matchTimeline(this.startState, indexedTimeline);
    }

    getNFAStates(): NFAState<T>[] {
        const visited = new Set<number>();
        const states: NFAState<T>[] = [];
        const stack: NFAState<T>[] = [this.startState];
        while (stack.length > 0) {
            const state = stack.pop()!;
            if (visited.has(state.id)) continue;
            visited.add(state.id);
            states.push(state);
            for (const transition of state.transitions) {
                if (!visited.has(transition.next.id)) {
                    stack.push(transition.next);
                }
            }
        }
        return states;
    }

    async getNFAVisualization(): Promise<SVGElement> {
        const visited = new Set<number>();
        const stack: NFAState<T>[] = [this.startState];
        let dot = "digraph NFA {\n  rankdir=LR;\n";

        while (stack.length > 0) {
            const state = stack.pop()!;
            if (visited.has(state.id)) continue;
            visited.add(state.id);

            // draw node
            dot += `  ${state.id} [shape=${state.isAccepting ? "doublecircle" : "circle"}];\n`;

            // draw edges
            for (const t of state.transitions) {
                const label = t.labels?.filter(Boolean).map(l => l.replaceAll('"', '\\"'))?.join("\\n") || "";

                dot += `  ${state.id} -> ${t.next.id} [label="${label}"];\n`;

                // enqueue next state
                if (!visited.has(t.next.id)) {
                    stack.push(t.next);
                }
            }
        }

        dot += "}";
        const instance = await Viz.instance();
        const svg = await instance.renderSVGElement(dot);
        return svg;
    }
}

function fnToString(fn?: Function): string {
    return fn?.toString()?.replace(/^\(e\)\W=>\W+/, "") || "ε";
}

export function createPatternMatcher<T extends StructFields = StructFields>(pattern: Pattern): PatternMatcher<T> {
    return new PatternMatcher<T>(pattern);
}

function eventPatternToNFA<T extends StructFields>(
    pattern: EventPattern<T>,
    stateIdCounter: { value: number }
): [NFAState<T>, NFAState<T>] {
    const start: NFAState<T> = { id: stateIdCounter.value++, transitions: [], isAccepting: false };
    const end: NFAState<T> = { id: stateIdCounter.value++, transitions: [], isAccepting: false };

    // normal transition
    start.transitions.push({
        match: pattern.matches,
        labels: [fnToString(pattern.matches), pattern.interval ? `[${pattern.interval?.min ?? ""}, ${pattern.interval?.max ?? ""}] ${pattern.interval?.unit}(s)` : ""],
        next: end,
        interval: pattern.interval,
        occurrence: pattern.occurrence ?? "any",
    });

    // negative transition
    start.transitions.push({
        match: undefined,
        labels: [`¬ ${fnToString(pattern.matches)}`],
        skipIf: (event) => !pattern.matches?.(event), // skip if matches
        next: start, // loop back to start
    });

    // optional epsilon transition
    if (pattern.optional) {
        start.transitions.push({ next: end, labels: ["ε (optional)"] });
    }

    return [start, end];
}

function sequencePatternToNFA<T extends StructFields>(
    pattern: SequencePattern,
    stateIdCounter: { value: number }
): [NFAState<T>, NFAState<T>] {
    let firstState: NFAState<T> | null = null;
    let lastEnd: NFAState<T> | null = null;

    for (const sub of pattern.patterns) {
        const [subStart, subEnd] = patternToNFA(sub, stateIdCounter);
        if (!firstState) firstState = subStart;
        if (lastEnd) lastEnd.transitions.push({ next: subStart, labels: ["ε"] }); // epsilon link
        lastEnd = subEnd;
    }

    if (!firstState || !lastEnd) {
        // If no patterns are defined, we create a NFA that accepts everything
        throw new Error("Sequence pattern must contain at least one sub-pattern");
    }

    return [firstState, lastEnd];
}

function choicePatternToNFA<T extends StructFields>(
    pattern: ChoicePattern,
    stateIdCounter: { value: number }
): [NFAState<T>, NFAState<T>] {
    const start: NFAState<T> = { id: stateIdCounter.value++, transitions: [], isAccepting: false };
    const end: NFAState<T> = { id: stateIdCounter.value++, transitions: [], isAccepting: false };

    for (const sub of pattern.patterns) {
        const [subStart, subEnd] = patternToNFA<T>(sub, stateIdCounter);
        start.transitions.push({ next: subStart, labels: ["ε"] }); // fork
        subEnd.transitions.push({ next: end, labels: ["ε"] }); // join
    }

    return [start, end];
}

function repeatPatternToNFA<T extends StructFields>(
    pattern: RepeatPattern,
    stateIdCounter: { value: number }
): [NFAState<T>, NFAState<T>] {
    const start: NFAState<T> = { id: stateIdCounter.value++, transitions: [], isAccepting: false };
    const end: NFAState<T>   = { id: stateIdCounter.value++, transitions: [], isAccepting: false };

    let currentStart = start;
    if (pattern.min === undefined) {
        pattern.min = 0; // default to 0 if not specified
    }

    // 1. Mandatory repetitions (min)
    for (let i = 0; i < pattern.min; i++) {
        const [subStart, subEnd] = patternToNFA<T>(pattern.pattern, stateIdCounter);
        currentStart.transitions.push({ next: subStart });
        currentStart = subEnd;
    }

    // 2. Optional repetitions (min → max)
    if (pattern.max !== undefined && pattern.max !== Infinity) {
        let remaining = pattern.max - pattern.min;

        for (let i = 0; i < remaining; i++) {
            const [subStart, subEnd] = patternToNFA<T>(pattern.pattern, stateIdCounter);
            // Option to continue with another copy
            currentStart.transitions.push({ next: subStart, labels: ["ε"] });
            // Option to stop early
            currentStart.transitions.push({ next: end, labels: ["ε"] });
            currentStart = subEnd;
        }
    } else {
        // unbounded (Kleene star–like)
        const [subStart, subEnd] = patternToNFA<T>(pattern.pattern, stateIdCounter);
        currentStart.transitions.push({ next: subStart, labels: ["ε"] });
        // allow exit anytime
        currentStart.transitions.push({ next: end, labels: ["ε"] });
        // loop
        subEnd.transitions.push({ next: subStart, labels: ["ε"] });
        subEnd.transitions.push({ next: end, labels: ["ε"] });
        currentStart = subEnd;
    }

    if (!currentStart.transitions.find(t => t.next.id === end.id)) {
        // 3. Connect final piece to end
        currentStart.transitions.push({ next: end, labels: ["ε"] });
    }

    return [start, end];
}

function dateAnchorPatternToNFA<T extends StructFields>(
    pattern: DateAnchorPattern,
    stateIdCounter: { value: number }
): [NFAState<T>, NFAState<T>] {
    const start: NFAState<T> = { id: stateIdCounter.value++, transitions: [], isAccepting: false };
    const end: NFAState<T> = { id: stateIdCounter.value++, transitions: [], isAccepting: false };

    // This is special because we do not consume any event, we just check the date

    start.transitions.push({
        match: undefined,
        labels: [`timestamp >= ${pattern.date.timestamp}`],
        skipIf: (event) => compareDates("after_or_equals", pattern.date, { timestamp: event.timestamp }),
        onTransition: (path) => {
            // Update anchors
            path.anchors.lastDateAnchor = pattern.date.timestamp;
        },
        next: end,
    });

    // negative transition
    start.transitions.push({
        match: undefined,
        labels: [`timestamp < ${pattern.date.timestamp}`],
        skipIf: (event) => compareDates("before", pattern.date, { timestamp: event.timestamp }), // skip if before anchor date
        next: start, // loop back to start
    });

    return [start, end];
}

function patternToNFA<T extends StructFields>(
    pattern: Pattern,
    stateIdCounter: { value: number }
): [NFAState<T>, NFAState<T>] {
    let [start, end]: [NFAState<T>, NFAState<T>] = [null as any, null as any];

    switch (pattern.type) {
        case "event":
            [start, end] = eventPatternToNFA(pattern, stateIdCounter);
            break;
        case "sequence":
            [start, end] = sequencePatternToNFA(pattern, stateIdCounter);
            break;
        case "choice":
            [start, end] = choicePatternToNFA(pattern, stateIdCounter);
            break;
        case "repeat":
            [start, end] = repeatPatternToNFA(pattern, stateIdCounter);
            break;
        case "date_anchor":
            [start, end] = dateAnchorPatternToNFA(pattern, stateIdCounter);
            break;
        default:
            throw new Error("Unknown pattern type");
    }
    return [start, end];
}
