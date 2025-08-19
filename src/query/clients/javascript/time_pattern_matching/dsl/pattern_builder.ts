import { DateTimeGranularity } from "@/utils/datetime";
import { EventOccurence, EventPattern, Pattern } from "./patterns";
import { MaskedDate } from "../../ambient/datetime";

export class PatternBuilder {
    private pattern: Pattern | undefined = undefined;

    sequence(...patterns: Pattern[]): this {
        this.pattern = {
            type: "sequence",
            patterns: patterns,
        };
        return this;
    }

    choice(...patterns: Pattern[]): this {
        this.pattern = {
            type: "choice",
            patterns: patterns,
        };
        return this;
    }

    repeat(pattern: Pattern, min?: number, max?: number): this {
        this.pattern = {
            type: "repeat",
            pattern: pattern,
            min: min,
            max: max,
        };
        return this;
    }

    dateAnchor(date: MaskedDate): this {
        this.pattern = {
            type: "date_anchor",
            date: date,
        };
        return this;
    }

    event(builder: (b: EventPatternBuilder) => EventPatternBuilder): this {
        const eventBuilder = new EventPatternBuilder();
        const eventPattern = builder(eventBuilder).build();
        this.pattern = eventPattern;
        return this;
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

export class EventPatternBuilder {
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
        max?: number,
        min?: number,
        unit?: DateTimeGranularity,
        relativeTo?: "lastAnchor" | "timelineStart" | "lastEventAnchor" | "lastDateAnchor"
    }): this {
        this.pattern.interval = {
            max: setup.max,
            min: setup.min,
            unit: setup.unit,
            relativeTo: setup.relativeTo,
        };
        return this;
    }

    build(): EventPattern {
        return this.pattern;
    }
}

export function buildPattern(): PatternBuilder {
    return new PatternBuilder();
}
