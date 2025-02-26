import { ColumnType, DataColumn } from "@/data/table";
import { MatcherState } from "@vitest/expect";

export function toBeUnique(this: MatcherState, received: DataColumn<ColumnType>) {
    const seenValues = new Set();
    let pass = true;

    for (let i = 0; i < received.values.length; i++) {
        const value = received.values[i]!
        if (seenValues.has(value)) {
            pass = false;
            break;
        }
        seenValues.add(value);
    }

    if (pass) {
        return {
            message: () =>
                `expected column to only contain unique values`,
            pass: true,
        };
    } else {
        return {
            message: () => `expected column to only contain unique values`,
            pass: false,
        };
    }
}