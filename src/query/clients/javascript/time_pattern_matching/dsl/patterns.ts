// Time Pattern Matching is fully dependent on the programming language, in this case JavaScript.
// If another language is used the type of patterns and the way they are expressed and interpreted can change
// because in the realm of V-ICE the pattern objects defined here are only used by the generator and then only interpreted
// by the JavaScript runtime, so they are never used anywhere else.

import { StructFields } from "@/data/types";
import { TimelineEntry } from "@/query/generation/timeline_templates";
import { DateTimeGranularity } from "@/utils/datetime";
import { MaskedDate } from "@/query/clients/javascript/ambient/datetime";

export type Pattern = EventPattern | SequencePattern | ChoicePattern | RepeatPattern | DateAnchorPattern;

export interface RelativeInterval {
    max?: number;
    min?: number;
    unit?: DateTimeGranularity;
    relativeTo?: "lastAnchor" | "timelineStart" | "lastEventAnchor" | "lastDateAnchor";
}

export type EventOccurence = "any" | "first" | "last" | "none";

export interface EventPattern<T extends StructFields = StructFields> {
    type: "event";
    matches?: (event: TimelineEntry<T>) => boolean;
    optional?: boolean;
    occurrence?: EventOccurence;
    interval?: RelativeInterval;
}

export interface SequencePattern {
    type: "sequence";
    patterns: Pattern[];
}

export interface ChoicePattern {
    type: "choice";
    patterns: Pattern[];
}

export interface RepeatPattern {
    type: "repeat";
    pattern: Pattern;
    min?: number;
    max?: number;
}

export interface DateAnchorPattern {
    type: "date_anchor";
    date: MaskedDate;
}
