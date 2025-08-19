import { DateTimeGranularityType } from "@/utils/datetime";
import { DateTime } from "luxon";

export interface MaskedDate {
    timestamp: string;
    masked?: DateTimeGranularityType[];
}

export function parseDate(input: MaskedDate | string): MaskedDate {
    return typeof input === "string" ? { timestamp: input } : input;
}

export function getMaskedDate(date: MaskedDate, mask: DateTimeGranularityType[]): DateTime {
    let dt = DateTime.fromISO(date.timestamp);
    for (const component of mask) {
        dt = dt.set({
            year: component === "year" ? 0 : dt.year,
            month: component === "month" ? 1 : dt.month,
            day: component === "day" ? 1 : dt.day,
            hour: component === "hour" ? 0 : dt.hour,
            minute: component === "minute" ? 0 : dt.minute,
            second: component === "second" ? 0 : dt.second,
        });
    }
    return dt;
}

export function combineMasks(a?: DateTimeGranularityType[], b?: DateTimeGranularityType[]): DateTimeGranularityType[] {
    return Array.from(new Set([...(a || []), ...(b || [])]));
}

export function compareDates(
    op: "equals" | "after" | "before" | "after_or_equals" | "before_or_equals",
    a: MaskedDate | string,
    b: MaskedDate | string
): boolean {
    const da = parseDate(a);
    const db = parseDate(b);

    const mask = combineMasks(da.masked, db.masked);
    const dtA = getMaskedDate(da, mask);
    const dtB = getMaskedDate(db, mask);

    switch (op) {
        case "equals":
            return dtA.equals(dtB);
        case "after":
            return dtA > dtB;
        case "before":
            return dtA < dtB;
        case "after_or_equals":
            return dtA >= dtB;
        case "before_or_equals":
            return dtA <= dtB;
    }
}

export function dateDiff(a: MaskedDate | string, b: MaskedDate | string, preferredUnit?: DateTimeGranularityType): number {
    const da = parseDate(a);
    const db = parseDate(b);

    const mask = combineMasks(da.masked, db.masked);
    const units: DateTimeGranularityType[] = ["second", "minute", "hour", "day", "month", "year"];

    // smallest unmasked unit
    const unit = units.find((u) => !mask.includes(u)) || "second";

    const dtA = DateTime.fromISO(da.timestamp);
    const dtB = DateTime.fromISO(db.timestamp);

    return Math.abs(dtA.diff(dtB, unit).as(preferredUnit ?? unit));
}
