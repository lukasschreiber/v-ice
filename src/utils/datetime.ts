import { DateTime } from "luxon";

/**
 * This function parses a date string and returns the timestamp in ISO format, a list of masked values and the format of the date.
 * The value must of one of the formats defined in the DateTimeGranularityFormats object.
 * 
 * If the value is not a valid date, the function returns null.
 * 
 * The function will try to parse the date starting from the format passed as the second argument, if it is passed.
 * 
 * All parts that are masked in the value will be passed as 0 in the timestamp to enable comparisons.
 * 
 * @param value the date string to parse
 * @param opt_suspectedFormat a format to start parsing from
 * @returns 
 */
export function parseDate(value: string | undefined, opt_suspectedFormat?: DateTimeGranularityFormat | null): { timestamp: string | null, maskedEntries: DateTimeGranularity[], format: DateTimeGranularityFormat | null, formatGranularity: DateTimeGranularity | null } {
    if (!value) {
        return { timestamp: null, maskedEntries: [DateTimeGranularity.MONTH, DateTimeGranularity.DAY, DateTimeGranularity.HOUR, DateTimeGranularity.MINUTE, DateTimeGranularity.SECOND], format: opt_suspectedFormat ?? null, formatGranularity: null};
    }

    let formats = Object.entries(DateTimeGranularityFormats)

    if (opt_suspectedFormat) {
        formats = formats.filter(([formatSuiteName]) => formatSuiteName !== opt_suspectedFormat);
        // we put the current format suite first to prioritize it
        formats.unshift([opt_suspectedFormat, DateTimeGranularityFormats[opt_suspectedFormat]]);
    }

    for (const [name, formatPrefix] of formats) {
        for (const [granularity, format] of Object.entries(formatPrefix)) {
            // value could be a prefix of a valid date string
            // and some values could be masked, e.g. "2021-**-**"
            const maskedValue = value
            let parsedValue = ""
            const maskedEntries: Set<DateTimeGranularity> = new Set()

            if (value.length > format.length) {
                continue
            }

            let valueIndex = 0
            for (let formatIndex = 0; formatIndex < format.length; formatIndex++) {
                if (valueIndex >= maskedValue.length) {
                    break
                }
                if (value[valueIndex] === "*") {
                    if (format[formatIndex] === "y") {
                        maskedEntries.add(DateTimeGranularity.YEAR)
                        parsedValue += '0000'
                        formatIndex += 3
                    } else if (format[formatIndex] === 'M') {
                        maskedEntries.add(DateTimeGranularity.MONTH);
                        parsedValue += '01';
                        formatIndex += 1;
                    } else if (format[formatIndex] === 'd') {
                        maskedEntries.add(DateTimeGranularity.DAY);
                        parsedValue += '01';
                        formatIndex += 1;
                    } else if (format[formatIndex] === 'H') {
                        maskedEntries.add(DateTimeGranularity.HOUR);
                        parsedValue += '00';
                        formatIndex += 1;
                    } else if (format[formatIndex] === 'm') {
                        maskedEntries.add(DateTimeGranularity.MINUTE);
                        parsedValue += '00';
                        formatIndex += 1;
                    } else if (format[formatIndex] === 's') {
                        maskedEntries.add(DateTimeGranularity.SECOND);
                        parsedValue += '00';
                        formatIndex += 1;
                    }
                } else {
                    parsedValue += value[valueIndex];
                }

                valueIndex++;
            }

            const parsed = DateTime.fromFormat(parsedValue, format.slice(0, parsedValue.length));
            if (parsed.isValid) {
                // masked entries are those that have been replaced while parsing or are cut off after slicing the format
                const includedEntries = new Set(format.slice(0, maskedValue.length).split("").map((char) => {
                    if (char === "y") {
                        return DateTimeGranularity.YEAR;
                    } else if (char === 'M') {
                        return DateTimeGranularity.MONTH;
                    } else if (char === 'd') {
                        return DateTimeGranularity.DAY;
                    } else if (char === 'H') {
                        return DateTimeGranularity.HOUR;
                    } else if (char === 'm') {
                        return DateTimeGranularity.MINUTE;
                    } else if (char === 's') {
                        return DateTimeGranularity.SECOND;
                    }
                    return null;
                }))

                const maskedEntriesArray = Array.from(Object.values(DateTimeGranularity)).filter((entry) => !includedEntries.has(entry as DateTimeGranularity) || maskedEntries.has(entry as DateTimeGranularity));
                return { timestamp: parsed.toISO(), maskedEntries: maskedEntriesArray, format: name as DateTimeGranularityFormat, formatGranularity: granularity as DateTimeGranularity};
            }
        }
    }

    return { timestamp: null, maskedEntries: [DateTimeGranularity.MONTH, DateTimeGranularity.DAY, DateTimeGranularity.HOUR, DateTimeGranularity.MINUTE, DateTimeGranularity.SECOND], format: opt_suspectedFormat ?? null, formatGranularity: null};
}

function getFormatCharForGranularity(granularity: DateTimeGranularity): string {
    switch (granularity) {
        case DateTimeGranularity.YEAR:
            return 'y';
        case DateTimeGranularity.MONTH:
            return 'M';
        case DateTimeGranularity.DAY:
            return 'd';
        case DateTimeGranularity.HOUR:
            return 'H';
        case DateTimeGranularity.MINUTE:
            return 'm';
        case DateTimeGranularity.SECOND:
            return 's';
    }
}

export function maskFormatString(format: string, maskedEntries: DateTimeGranularity[]): string {
    for (const entry of maskedEntries) {
        const formatChar = getFormatCharForGranularity(entry);
        const regex = new RegExp(`${formatChar}+`, "g")
        format = format.replace(regex, "*");
    }

    return format;
}

export enum DateTimeGranularity {
    YEAR = "year",
    MONTH = "month",
    DAY = "day",
    HOUR = "hour",
    MINUTE = "minute",
    SECOND = "second",
}

export type DateTimeGranularityType = "year" | "month" | "day" | "hour" | "minute" | "second";

export const DateTimeGranularityLabels = {
    [DateTimeGranularity.YEAR]: "Year",
    [DateTimeGranularity.MONTH]: "Month",
    [DateTimeGranularity.DAY]: "Day",
    [DateTimeGranularity.HOUR]: "Hour",
    [DateTimeGranularity.MINUTE]: "Minute",
    [DateTimeGranularity.SECOND]: "Second",
}

export enum DateTimeGranularityFormat {
    ISO = "iso",
    ISO_TIME_BEFORE_DATE = "iso-time-before-date",
    LOCALE = "locale",
    LOCALE_TIME_BEFORE_DATE = "locale-time-before-date",
}

export const DateTimeGranularityFormats = {
    [DateTimeGranularityFormat.ISO]: {
        [DateTimeGranularity.YEAR]: "yyyy",
        [DateTimeGranularity.MONTH]: "yyyy-MM",
        [DateTimeGranularity.DAY]: "yyyy-MM-dd",
        [DateTimeGranularity.HOUR]: "yyyy-MM-dd HH",
        [DateTimeGranularity.MINUTE]: "yyyy-MM-dd HH:mm",
        [DateTimeGranularity.SECOND]: "yyyy-MM-dd HH:mm:ss",
    },
    [DateTimeGranularityFormat.ISO_TIME_BEFORE_DATE]: {
        [DateTimeGranularity.YEAR]: "yyyy",
        [DateTimeGranularity.MONTH]: "MM-yyyy",
        [DateTimeGranularity.DAY]: "dd-MM-yyyy",
        [DateTimeGranularity.HOUR]: "HH dd-MM-yyyy",
        [DateTimeGranularity.MINUTE]: "HH:mm dd-MM-yyyy",
        [DateTimeGranularity.SECOND]: "HH:mm:ss dd-MM-yyyy",
    },
    [DateTimeGranularityFormat.LOCALE]: {
        [DateTimeGranularity.YEAR]: "yyyy",
        [DateTimeGranularity.MONTH]: "MM.yyyy",
        [DateTimeGranularity.DAY]: "dd.MM.yyyy",
        [DateTimeGranularity.HOUR]: "dd.MM.yyyy HH",
        [DateTimeGranularity.MINUTE]: "dd.MM.yyyy HH:mm",
        [DateTimeGranularity.SECOND]: "dd.MM.yyyy HH:mm:ss",
    },
    [DateTimeGranularityFormat.LOCALE_TIME_BEFORE_DATE]: {
        [DateTimeGranularity.YEAR]: "yyyy",
        [DateTimeGranularity.MONTH]: "MM-yyyy",
        [DateTimeGranularity.DAY]: "dd-MM-yyyy",
        [DateTimeGranularity.HOUR]: "HH dd-MM-yyyy",
        [DateTimeGranularity.MINUTE]: "HH:mm dd-MM-yyyy",
        [DateTimeGranularity.SECOND]: "HH:mm:ss dd-MM-yyyy",
    },
}

