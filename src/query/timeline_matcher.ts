
import { MatchableEvent, Timeline, TimelineEntry, TimelineTemplate, TimelineTemplateDate, TimelineTemplateEvent, TimelineTemplateInterval, TimelineTemplateSkip, TimelineTemplateSkipBase, TimelineTemplateSkipInterval } from "./generation/timeline_templates";
import { IStructType, StructFields, ValueOf } from "@/data/types";
import { DateTimeGranularityType } from "@/utils/datetime";
import { type DateTime } from "luxon";

// Code Duplocation in ambient_functions.ts and timeline_matcher.ts
export function maskDateTimeline(date: string, maskedComponents?: DateTimeGranularityType[]): string {
    maskedComponents = maskedComponents ?? []
    // the date string is in ISO format, so it is: yyyy-MM-ddThh:mm:ss.sssZ
    let dateTime = window.luxon.DateTime.fromISO(date)
    for (const component of maskedComponents) {
        dateTime = dateTime.set({[component]: component === "month" || component === "day" ? 1 : 0})
    }
    return dateTime.toFormat("yyyy-MM-dd'T'HH:mm:ss")
}

/**
 * Returns the smallest unit from a list.
 * This is used to determine the precision of the time values. 
 * 
 * @param units A list of units (e.g. ["s", "m", "h", "d", "w", "M", "y"])
 * @returns The smallest unit from the list
 */
export function minimalUnit(units: string[]) {
    if (units.includes("s")) return "s"
    if (units.includes("m")) return "m"
    if (units.includes("h")) return "h"
    return "d" // for all bigger units we default to days
}

/**
 * Converts a time duration to milliseconds.
 * 
 * @param duration The duration
 * @param unit The unit of the duration (e.g. "s", "m", "h", "d", "w", "M", "y")
 * @returns The duration in milliseconds
 */
export function timeToMilliseconds(duration: number, unit: string) {
    return duration * timeMultiplier(unit)
}

/**
 * Returns the time multiplier for a given unit.
 * If a value with the unit is multiplied with the result of this function, the value is converted to milliseconds.
 * 
 * @param unit The unit (e.g. "s", "m", "h", "d", "w", "M", "y")
 * @returns The time multiplier
 */
export function timeMultiplier(unit: string) {
    switch (unit) {
        case "s":
            return 1000
        case "m":
            return 1000 * 60
        case "h":
            return 1000 * 60 * 60
        case "d":
            return 1000 * 60 * 60 * 24
        case "w":
            return 1000 * 60 * 60 * 24 * 7
        case "M":
            return 1000 * 60 * 60 * 24 * 30
        case "y":
            return 1000 * 60 * 60 * 24 * 365
        default:
            return 0
    }
}

export function unitToLuxonUnit(unit: string): "second" | "minute" | "hour" | "day" | "week" | "month" | "year" {
    switch (unit) {
        case "s":
            return "second"
        case "m":
            return "minute"
        case "h":
            return "hour"
        case "d":
            return "day"
        case "w":
            return "week"
        case "M":
            return "month"
        case "y":
            return "year"
        default:
            return "day"
    }
}


export function eventsMatch(timelineEntry: TimelineEntry<StructFields>, event: MatchableEvent) {
    const limit = event.limit
    const matcher = event.event
    if (typeof matcher === "function") {
        return matcher(timelineEntry) && (limit === undefined || timelineEntry.limit === limit)
    }
    return Object.keys(matcher).every(key => {
        return timelineEntry[key] === matcher[key] && (limit === undefined || timelineEntry.limit === limit)
    })
}

export function getChildLoops(loops: LoopState[], index: number) {
    const children: LoopState[] = []
    const queue = [index]
    while (queue.length > 0) {
        const currentIndex = queue.shift()!
        const childIndices = loops.map((loop, i) => loop.parentLoopIndex === currentIndex ? i : -1).filter(i => i !== -1)
        children.push(...childIndices.map(i => loops[i]))
        queue.push(...childIndices)
    }

    return children
}

interface LoopState {
    startOfLoop: number
    endOfLoop: number
    loopEvent: MatchableEvent
    loopIteration: number
    parentLoopIndex: number | null
}

export function preprocessTimeline(timeline: Timeline<StructFields>) {
    // we need to convert all intervals to one start and one end event
    const newTimeline: Timeline<StructFields> = []

    for (const entry of timeline) {
        if (entry.start && entry.end) {
            const newEntry: ValueOf<IStructType<StructFields>> = { ...entry };
            delete newEntry.timestamp;
            // actually we should keep start and end
            // delete newEntry.start;
            // delete newEntry.end;

            newTimeline.push({
                ...entry,
                limit: "start",
                timestamp: entry.start,
            } as unknown as TimelineEntry<StructFields>)
            newTimeline.push({
                ...entry,
                limit: "end",
                timestamp: entry.end,
            } as unknown as TimelineEntry<StructFields>)
        } else {
            newTimeline.push(entry)
        }
    }

    // sort the timeline by timestamp
    newTimeline.sort((a, b) => {
        if (a.timestamp === b.timestamp) return 0
        // we can use the default comparison because the timestamps are in ISO format
        return a.timestamp < b.timestamp ? -1 : 1
    })
    
    return newTimeline
}

// it does not use backtracking, but backtracking is needed for garden path situations
// the parameters startIndex and endIndex are not used in the current implementation
export function matchTimeline(template_: TimelineTemplate, timeline: Timeline<StructFields>, startIndex: number = 0, endIndex: number = timeline.length) {
    // if the template is empty every timeline matches
    if (template_.length === 0) return true
    // if the timeline is empty no template can match
    if (timeline.length === 0) return false

    // we clone the template so that we do not modify the original, this is important for recursive calls
    // loop unrolling modifies the template in place
    const template = template_.slice()

    // we always start from the beginning of the template
    // the starting point in the timeline can be specified, this is also needed for recursive calls
    let templateIndex = 0
    let timelineIndex = startIndex

    // we keep track of the current iteration to prevent infinite loops
    let iteration = 0

    // we keep track of the loop state for all loops that are currently active and cannot be unrolled
    const loopStack: LoopState[] = []
    let currentLoopIndex: number | null = null

    // we keep track of unexpected events that should not occur, this are events that are marked with "DOES_NOT_OCCUR"
    // if we encounter such an event we can immediately return false
    // the set is cleared whenever we reach an anchor, event or date
    const unexpectedEvents: MatchableEvent[] = []

    // we keep track of template entries that have been handled
    const handledTemplateEntries: Set<number> = new Set()

    // we keep track of events that have been seen, this is used to check if an event is the first occurrence
    const seenEvents: TimelineEntry<StructFields>[] = []

    /**
     * Returns the next template index
     * If we are in a loop, the index is updated accordingly
     * If we are at the end of the template, the index is not updated
     */
    const nextTemplateEntry = () => {
        if (currentLoopIndex !== null) {
            const childLoops = getChildLoops(loopStack, currentLoopIndex)

            // if there is a childLoop starting at the current index, we need to update the currentLoopIndex
            const childLoop = childLoops.find(loop => loop.startOfLoop === templateIndex)
            if (childLoop) {
                currentLoopIndex = loopStack.indexOf(childLoop)
                childLoop.loopIteration = 0
                templateIndex = childLoop.startOfLoop
            } else {
                const loop = loopStack[currentLoopIndex]
                if (templateIndex < loop.endOfLoop - 1) {
                    templateIndex++
                } else {
                    loop.loopIteration++
                    templateIndex = loop.startOfLoop
                }
            }

        } else if (templateIndex < template.length - 1) {
            templateIndex++
        }
    }

    // we need to determine the start time of the timeline
    // this could be the timestamp of the first event or the start time of the first interval
    // if we do not have a timestamp or start time, we default to 0
    let absoluteStartTime: DateTime = window.luxon.DateTime.fromISO(maskDateTimeline("1000-01-01T00:00:00.000Z")) // we default to a time well in the past
    if (timeline[0].timestamp !== undefined) {
        absoluteStartTime = window.luxon.DateTime.fromISO(maskDateTimeline(timeline[0].timestamp))
    } else if (timeline[0].start !== undefined) {
        absoluteStartTime = window.luxon.DateTime.fromISO(maskDateTimeline(timeline[0].start))
    }

    /**
     * The maximum number of iterations that the timeline matcher is allowed to run
     */
    const maxIterations = 1000

    // we iterate over the template and the timeline until we reach the end of the timeline or the maximum number of iterations
    while (timelineIndex < endIndex && iteration < maxIterations) {
        // we first create a mutable template entry because we might need to modify it on exiting a loop
        let templateEntry_ = template[templateIndex]
        let timelineEntry_ = timeline[timelineIndex]

        // the loop we are currently in, if we are not in a loop this is undefined
        let loop: LoopState | undefined = currentLoopIndex === null ? undefined : loopStack[currentLoopIndex]

        // if we are in a loop and the event type matches the loop type, we have reached the end of the loop
        if (loop !== undefined && currentLoopIndex !== null && eventsMatch(timelineEntry_, loop.loopEvent)) {
            templateIndex = loop.endOfLoop > template.length - 1 ? template.length - 1 : loop.endOfLoop
            templateEntry_ = template[templateIndex]

            // TODO: this is probably wrong
            if (loop.endOfLoop === template.length && loopStack.length === 1) {
                break
            }

            timelineIndex = timelineIndex < timeline.length - 1 ? timelineIndex + 1 : timelineIndex
            timelineEntry_ = timeline[timelineIndex]

            if (loop.parentLoopIndex !== null) {
                currentLoopIndex = loop.parentLoopIndex
                loop = loopStack[currentLoopIndex]
                loop.loopIteration++
                templateIndex = loop.startOfLoop
            } else {
                currentLoopIndex = null
                loop = undefined
            }

            nextTemplateEntry()
            templateEntry_ = template[templateIndex]
        }

        const templateEntry = templateEntry_
        const timelineEntry = timelineEntry_

        // console.log(`${iteration} - loop: ${currentLoopIndex} templateIndex: ${templateIndex}, timelineIndex: ${timelineIndex}`, templateEntry, timelineEntry)

        if (templateEntry.type_ === "event" || templateEntry.type_ === "interval") {
            const nextTimelineDateEntry = timeline.slice(timelineIndex).find(entry => entry.type === "date")
            if (templateEntry.op === "DOES_NOT_OCCUR") {
                // if the event should not occur, we add it to the unexpected events set and move to the next template entry
                unexpectedEvents.push({event: templateEntry.event, limit: templateEntry.type_ === "interval" ? templateEntry.limit : undefined})
                nextTemplateEntry()
            } else if (
                eventsMatch(timelineEntry, {event: templateEntry.event, limit: templateEntry.type_ === "interval" ? templateEntry.limit : undefined})
                && (templateEntry.op === "OCCURS" || templateEntry.op === "LAST_OCCURRENCE" || (templateEntry.op === "FIRST_OCCURRENCE" && !seenEvents.find(event => eventsMatch(event, {event: templateEntry.event, limit: templateEntry.type_ === "interval" ? templateEntry.limit : undefined}))))
                && (!nextTimelineDateEntry || nextTimelineDateEntry.timestamp >= timelineEntry.timestamp)
            ) {
                if (templateEntry.op === "LAST_OCCURRENCE") {
                    if (!timeline.slice(timelineIndex + 1).every(entry => !eventsMatch(entry, {event: templateEntry.event, limit: templateEntry.type_ === "interval" ? templateEntry.limit : undefined})) && templateIndex < template.length - 1) {
                        return false
                    }
                }

                const loop: LoopState | undefined = loopStack[loopStack.length - 1]
                const relevantSkipEntries: TimelineTemplateSkipBase[] = []
                let skipAnchorIndex: number | null = null
                let skipAnchorTime: DateTime | null = null

                let searchUntilIndex = 0
                if (loop !== undefined) {
                    if (loop.loopIteration > 0) {
                        searchUntilIndex = loop.startOfLoop
                    } else {
                        let parentLoopIndex = loop.parentLoopIndex
                        while (parentLoopIndex !== null) {
                            if (loopStack[parentLoopIndex].loopIteration > 0) {
                                searchUntilIndex = loopStack[parentLoopIndex].startOfLoop
                            }
                            parentLoopIndex = loopStack[parentLoopIndex].parentLoopIndex
                        }
                    }
                }

                for (let i = templateIndex - 1; i >= searchUntilIndex; i--) {
                    if (template[i].type_ === "skip" || template[i].type_ === "skip_interval") {
                        // determine the number of times this skip entry should be considered based on the loop iteration and all parent loop iterations
                        if (loop === undefined) {
                            relevantSkipEntries.push(template[i] as TimelineTemplateSkipBase)
                        } else {
                            let parentLoopIndex = loop.parentLoopIndex
                            let count = 1
                            while (parentLoopIndex) {
                                count *= loopStack[parentLoopIndex].loopIteration
                                parentLoopIndex = loopStack[parentLoopIndex]?.parentLoopIndex
                            }

                            for (let j = 0; j < count; j++) {
                                relevantSkipEntries.push(template[i] as TimelineTemplateSkipBase)
                            }
                        }

                    } else {
                        skipAnchorIndex = i
                        break
                    }
                }

                if (skipAnchorIndex === null && loop?.loopIteration > 0) {
                    // if we are in a loop and we are not in the first iteration, we need to look for the skip anchor in the previous loop
                    for (let i = loop?.endOfLoop - 1; i >= 0; i--) {
                        if (template[i].type_ !== "skip" && template[i].type_ !== "skip_interval") {
                            skipAnchorIndex = i
                            break
                        }
                    }
                }

                if (skipAnchorIndex !== null && relevantSkipEntries.length > 0) {
                    if (template[skipAnchorIndex].type_ === "date") {
                        const date = template[skipAnchorIndex] as TimelineTemplateDate
                        skipAnchorTime = window.luxon.DateTime.fromISO(maskDateTimeline(date.timestamp.timestamp, date.timestamp.masked))
                    } else if (template[skipAnchorIndex].type_ === "event" || template[skipAnchorIndex].type_ === "interval") {
                        const event = template[skipAnchorIndex] as TimelineTemplateEvent | TimelineTemplateInterval
                        for (let i = timelineIndex - 1; i >= 0; i--) {
                            if (eventsMatch(timeline[i], {event: event.event, limit: event.type_ === "interval" ? event.limit : undefined})) {
                                skipAnchorTime = window.luxon.DateTime.fromISO(maskDateTimeline(timeline[i].timestamp))
                                break
                            }
                        }
                    }

                    skipAnchorTime = (skipAnchorTime ?? absoluteStartTime)
                    const precision = minimalUnit(relevantSkipEntries.map(entry => entry.unit))
                    const unit = unitToLuxonUnit(precision)
                    const currentTime = window.luxon.DateTime.fromISO(timelineEntry.timestamp).startOf(unit)
                    const minSkipTime = relevantSkipEntries.reduce((acc, entry_) => {
                        if (entry_.type_ === "skip_interval") return acc + timeToMilliseconds((entry_ as TimelineTemplateSkipInterval).minDuration, entry_.unit)
                        const entry = entry_ as TimelineTemplateSkip
                        if (entry.op === "EXACTLY" || entry.op === "AT_LEAST") {
                            return acc + timeToMilliseconds(entry.duration, entry.unit)
                        }
                        return acc
                    }, 0) / timeMultiplier(precision)
                    const maxSkipTime = relevantSkipEntries.reduce((acc, entry_) => {
                        if (entry_.type_ === "skip_interval") return acc + timeToMilliseconds((entry_ as TimelineTemplateSkipInterval).maxDuration, entry_.unit)
                        const entry = entry_ as TimelineTemplateSkip
                        if (entry.op === "EXACTLY" || entry.op === "AT_MOST") {
                            return acc + timeToMilliseconds(entry.duration, entry.unit)
                        }
                        return acc + Infinity
                    }, 0) / timeMultiplier(precision)

                    // console.log("skipAnchorTime", skipAnchorTime, "currentTime", currentTime, "minSkipTime", minSkipTime, "maxSkipTime", maxSkipTime)
                    if (currentTime.startOf(unit) < skipAnchorTime.plus({[unitToLuxonUnit(precision)]: minSkipTime}).startOf(unit) || (maxSkipTime !== Infinity && currentTime.startOf(unit) > skipAnchorTime.plus({[unitToLuxonUnit(precision)]: maxSkipTime}).startOf(unit))) {
                        return false
                    }
                    // console.log("continue")

                    for (let i = skipAnchorIndex + 1; i < templateIndex; i++) {
                        handledTemplateEntries.add(i)
                    }
                }

                // if we have a match for "occurs" we clear all block marks
                unexpectedEvents.length = 0
                handledTemplateEntries.add(templateIndex)
                if (handledTemplateEntries.size === template.length) {
                    break
                }
                nextTemplateEntry()
            }

            if (unexpectedEvents.find(event => eventsMatch(timelineEntry, event))) {
                // we have encountered this event at a time where it should not occur so we immediately return false
                return false
            }

            seenEvents.push(timelineEntry)
            timelineIndex++
        } else if (templateEntry.type_ === "date") {
            const date = templateEntry as TimelineTemplateDate
            const timestamp = maskDateTimeline(date.timestamp.timestamp, date.timestamp.masked)
            const firstTimelineEntryAfterTimestamp = timeline.slice(timelineIndex).find(entry => entry.timestamp ? maskDateTimeline(entry.timestamp) >= timestamp : maskDateTimeline(entry.start) >= timestamp)
            if (firstTimelineEntryAfterTimestamp && !handledTemplateEntries.has(templateIndex)) {
                timelineIndex = timeline.indexOf(firstTimelineEntryAfterTimestamp)
                unexpectedEvents.length = 0
                handledTemplateEntries.add(templateIndex)
                nextTemplateEntry()
            } else {
                timelineIndex++
            }
            unexpectedEvents.length = 0
        } else if (templateEntry.type_ === "skip" || templateEntry.type_ === "skip_interval") {
            // if skip or skip_interval is the last entry in the template, we can ignore it
            if (templateIndex === template.length - 1) {
                handledTemplateEntries.add(templateIndex)
                timelineIndex = endIndex
            }
            nextTemplateEntry()
        } else if (templateEntry.type_ === "no_event" || templateEntry.type_ === "no_interval") {
            const precision = templateEntry.unit
            let noEventAnchorTime: DateTime | null = null

            for (let i = templateIndex - 1; i >= 0; i--) {
                if (template[i].type_ === "date") {
                    const date = template[i] as TimelineTemplateDate
                    noEventAnchorTime = window.luxon.DateTime.fromISO(maskDateTimeline(date.timestamp.timestamp, date.timestamp.masked ?? []))
                    break
                } else if (template[i].type_ === "event" || template[i].type_ === "interval") {
                    const event = template[i] as TimelineTemplateEvent | TimelineTemplateInterval
                    for (let j = timelineIndex - 1; j >= 0; j--) {
                        if (eventsMatch(timeline[j], {event: event.event, limit: event.type_ === "interval" ? event.limit : undefined})) {
                            noEventAnchorTime = window.luxon.DateTime.fromISO(maskDateTimeline(timeline[j].timestamp))
                            break
                        }
                    }
                }
            }

            if (noEventAnchorTime === null) noEventAnchorTime = absoluteStartTime

            const lookAheadTime = timeToMilliseconds(templateEntry.duration, precision)
            // we look at all events that are in the future and 
            const relevantEvents = timeline.slice(timelineIndex).filter(entry => eventsMatch(entry, {event: templateEntry.event, limit: templateEntry.type_ === "no_interval" ? templateEntry.limit : undefined}) && (window.luxon.DateTime.fromISO(entry.timestamp) <= noEventAnchorTime!.plus(lookAheadTime) || window.luxon.DateTime.fromISO(entry.start) <= noEventAnchorTime!.plus(lookAheadTime)))
            if (relevantEvents.length > 0) {
                return false
            }

            handledTemplateEntries.add(templateIndex)

            // if no_event is the last entry in the template, we can ignore it once we have handled it
            if (templateIndex === template.length - 1) {
                timelineIndex = endIndex
            } else {
                nextTemplateEntry()
            }
        } else if (templateEntry.type_ === "options") {
            const options = templateEntry.options

            const optionMatch = options.find(option => {
                const templateCopy = template.slice()
                templateCopy.splice(templateIndex, 1, ...option)
                return matchTimeline(templateCopy, timeline) === true
            })

            if (!optionMatch) {
                return false
            }

            // now we can just add this option to the template and match it again in the main branch to get the correct timeline index
            template.splice(templateIndex, 1, ...optionMatch)

            if (loopStack.length > 0) {
                loopStack.forEach(loop => {
                    if (loop.startOfLoop > templateIndex) {
                        // the count loop is before the loop
                        loop.startOfLoop += optionMatch.length - 1
                        loop.endOfLoop += optionMatch.length - 1
                    } else if (loop.endOfLoop > templateIndex) {
                        // the count loop is in the loop
                        loop.endOfLoop += optionMatch.length - 1
                    }
                })
            }

            timelineIndex++
            handledTemplateEntries.add(templateIndex)
            nextTemplateEntry()
        } else if (templateEntry.type_ === "loop_count") {
            const loopBody = []
            for (let i = 0; i < templateEntry.count; i++) {
                loopBody.push(...templateEntry.template)
            }

            template.splice(templateIndex, 1, ...loopBody)

            // we have to correct the loopStack for the changed template, start and end of the loops might have changed if the index at which the unrolled loop starts is before, in or after the loop
            if (loopStack.length > 0) {
                loopStack.forEach(loop => {
                    if (loop.startOfLoop > templateIndex) {
                        // the count loop is before the loop
                        loop.startOfLoop += loopBody.length - 1
                        loop.endOfLoop += loopBody.length - 1
                    } else if (loop.endOfLoop > templateIndex) {
                        // the count loop is in the loop
                        loop.endOfLoop += loopBody.length - 1
                    }
                })
            }

        } else if (templateEntry.type_ === "loop_until") {
            template.splice(templateIndex, 1, ...templateEntry.template)
            const parentLoopIndex = loopStack.length > 0 ? loopStack.length - 1 : null
            loopStack.push({
                startOfLoop: templateIndex,
                endOfLoop: templateIndex + templateEntry.template.length,
                loopEvent: {event: templateEntry.untilEvent},
                loopIteration: 0,
                parentLoopIndex: parentLoopIndex
            })

            // we have to go recursively through the parentLoops and update their endOfLoop
            let i = parentLoopIndex
            while (i !== null) {
                loopStack[i].endOfLoop += templateEntry.template.length - 1
                i = loopStack[i].parentLoopIndex
            }

            currentLoopIndex = loopStack.length - 1
        }

        iteration++
    }

    // if all template entries that have not been handled at this point are DOES_NOT_OCCUR events, we return true
    const unhandledTemplateEntries = template.filter((_, i) => !handledTemplateEntries.has(i))
    if (unhandledTemplateEntries.every(i => (i.type_ === "event" || i.type_ === "interval") && (i as TimelineTemplateEvent).op === "DOES_NOT_OCCUR")) {
        return true
    }

    return handledTemplateEntries.size === template.length || unexpectedEvents.length > 0
}