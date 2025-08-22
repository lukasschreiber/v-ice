import { DateTimeGranularity } from "@/utils/datetime";
import { EventOccurence, EventPattern, Pattern } from "./patterns";
import { MaskedDate } from "../../ambient/datetime";

export interface IPatternBuilder {
    build(): Pattern;
}

class PatternBuilder {
    private pattern: Pattern | undefined = undefined;

    private unwrap(p: Pattern | IPatternBuilder): Pattern {
        if (isPatternBuilder(p)) {
            return p.build();
        }
        return p;
    }

    sequence(...patterns: (Pattern | IPatternBuilder)[]): this {
        this.pattern = {
            type: "sequence",
            patterns: patterns.map((p) => this.unwrap(p)),
        };
        return this;
    }

    choice(...patterns: (Pattern | IPatternBuilder)[]): this {
        this.pattern = {
            type: "choice",
            patterns: patterns.map((p) => this.unwrap(p)),
        };
        return this;
    }

    repeat(pattern: Pattern | IPatternBuilder): RepeatPatternBuilder {
        return new RepeatPatternBuilder(pattern);
    }

    dateAnchor(date: MaskedDate): this {
        this.pattern = {
            type: "date_anchor",
            date: date,
        };
        return this;
    }

    // shortcut for simple matches
    eventMatch(fn: (event: any) => boolean): EventPatternBuilder {
        const builder = new EventPatternBuilder();
        builder.matches(fn);
        return builder;
    }

    build(): Pattern {
        if (!this.pattern) {
            return {
                type: "sequence",
                patterns: [],
            };
        }
        return this.pattern;
    }
}

class EventPatternBuilder {
    private pattern: EventPattern = {
        type: "event",
    };

    matches(fn: (event: any) => boolean): this {
        this.pattern.matches = fn;
        return this;
    }

    optional(): this {
        this.pattern.optional = true;
        return this;
    }

    occurrence(occurrence: EventOccurence): this {
        this.pattern.occurrence = occurrence;
        return this;
    }

    interval(setup: {
        max?: number;
        min?: number;
        unit?: DateTimeGranularity;
        relativeTo?: "lastAnchor" | "timelineStart" | "lastEventAnchor" | "lastDateAnchor";
    }): this {
        this.pattern.interval = {
            max: setup.max,
            min: setup.min,
            unit: setup.unit,
            relativeTo: setup.relativeTo,
        };
        return this;
    }

    intervalMin(min: number, unit: DateTimeGranularity): this {
        this.pattern.interval = {
            ...this.pattern.interval,
            min: min,
            unit: unit,
        };
        return this;
    }

    intervalMax(max: number, unit: DateTimeGranularity): this {
        this.pattern.interval = {
            ...this.pattern.interval,
            max: max,
            unit: unit,
        };
        return this;
    }

    intervalRange(min: number, max: number, unit: DateTimeGranularity): this {
        this.pattern.interval = {
            min: min,
            max: max,
            unit: unit,
        };
        return this;
    }

    relativeTo(relativeTo: "lastAnchor" | "timelineStart" | "lastEventAnchor" | "lastDateAnchor"): this {
        if (!this.pattern.interval) {
            this.pattern.interval = {};
        }
        this.pattern.interval.relativeTo = relativeTo;
        return this;
    }

    build(): EventPattern {
        return this.pattern;
    }
}

class RepeatPatternBuilder {
    private minVal?: number;
    private maxVal?: number;

    constructor(private child: Pattern | IPatternBuilder) {}

    min(n: number): this {
        this.minVal = n;
        return this;
    }

    max(n: number): this {
        this.maxVal = n;
        return this;
    }

    times(n: number): this {
        this.minVal = n;
        this.maxVal = n;
        return this;
    }

    build(): Pattern {
        const unwrapped = isPatternBuilder(this.child) ? this.child.build() : this.child;
        return {
            type: "repeat",
            pattern: unwrapped,
            min: this.minVal,
            max: this.maxVal,
        };
    }
}

function buildPattern(): PatternBuilder {
    return new PatternBuilder();
}

// compact DSL
export const P = {
    seq: (...p: (IPatternBuilder | Pattern)[]) => buildPattern().sequence(...p),
    choice: (...p: (IPatternBuilder | Pattern)[]) => buildPattern().choice(...p),
    repeat: (p: IPatternBuilder | Pattern) => buildPattern().repeat(p),
    event: (fn: (e: any) => boolean) => buildPattern().eventMatch(fn),
    date: (date: MaskedDate) => buildPattern().dateAnchor(date),
    empty: () => buildPattern().build(),
};

export function isPatternBuilder(obj: any): obj is IPatternBuilder {
    return obj && typeof obj.build === "function";
}