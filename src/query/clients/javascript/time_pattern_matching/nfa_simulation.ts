import { StructFields } from "@/data/types";
import { TimelineEntry } from "@/query/generation/timeline_templates";
import { NFAState } from "./nfa";
import { dateDiff } from "../ambient/datetime";
import { DateTime } from "luxon";

export type TimelineEntryWithIndex<T extends StructFields> = TimelineEntry<T> & {
    index: number; // position in timeline
};

export type Path<T extends StructFields> = {
    state: NFAState<T>;
    index: number;
    matched: TimelineEntryWithIndex<T>[];
    anchors: {
        timelineStart?: string;
        lastEventAnchor?: string;
        lastDateAnchor?: string;
    };
};

export function matchTimeline<T extends StructFields>(
    nfaStart: NFAState<T>,
    timeline: TimelineEntryWithIndex<T>[],
    debugEvents?: {
        onChangeState?: (state: NFAState<T>, event: TimelineEntryWithIndex<T>) => void;
        onAcceptingState?: (state: NFAState<T>, matched: TimelineEntryWithIndex<T>[]) => void;
    }
): TimelineEntryWithIndex<T>[][] {
    const results: TimelineEntryWithIndex<T>[][] = [];

    let paths: Path<T>[] = [
        { state: nfaStart, index: 0, matched: [], anchors: { timelineStart: timeline[0]?.timestamp } },
    ];

    while (paths.length > 0) {
        const newPaths: Path<T>[] = [];

        for (const path of paths) {
            const { state, index, matched, anchors } = path;

            // Record match if accepting
            if (state.isAccepting) {
                results.push([...matched]);
                debugEvents?.onAcceptingState?.(state, matched);
            }

            for (const trans of state.transitions) {
                if (trans.onTransition) {
                    trans.onTransition(path as Path<StructFields>, timeline[index] ?? (null as any));
                }

                if (trans.skipIf) {
                    for (let i = index; i < timeline.length; i++) {
                        if (trans.skipIf(timeline[i])) {
                            const nextPath = {
                                state: trans.next,
                                index: i + 1,
                                matched: [...matched],
                                anchors: { ...anchors },
                            };
                            newPaths.push(nextPath);
                            debugEvents?.onChangeState?.(trans.next, timeline[i]);
                        }
                    }
                    continue;
                }

                if (!trans.match) {
                    // Epsilon transition: explore without consuming an event
                    const nextPath = { state: trans.next, index, matched: [...matched], anchors: { ...anchors } };
                    newPaths.push(nextPath);
                    debugEvents?.onChangeState?.(trans.next, timeline[index] ?? (null as any));
                    continue;
                }

                if (index < timeline.length) {
                    const event = timeline[index];

                    // occurrence filter
                    // TODO: Just anything for now, needs to be implemented properly
                    if (trans.occurrence === "none") continue;
                    if (trans.occurrence === "first" && index !== 0) continue;
                    if (trans.occurrence === "last" && index !== timeline.length - 1) continue;

                    // interval check (if there is a previous match)
                    if (trans.interval) {
                        let anchorTime: string | undefined;

                        switch (trans.interval.relativeTo) {
                            case "lastEventAnchor":
                                anchorTime = anchors.lastEventAnchor ?? anchors.timelineStart;
                                break;
                            case "lastDateAnchor":
                                anchorTime = anchors.lastDateAnchor ?? anchors.timelineStart;
                                break;
                            case "timelineStart":
                                anchorTime = anchors.timelineStart;
                                break;
                            default: // undefined or "lastAnchor"
                                const candidates = [
                                    anchors.lastEventAnchor,
                                    anchors.lastDateAnchor,
                                    anchors.timelineStart,
                                ].filter(Boolean) as string[];
                                anchorTime = candidates.length
                                    ? candidates.reduce((a, b) => (DateTime.fromISO(a) > DateTime.fromISO(b) ? a : b))
                                    : timeline[index]?.timestamp;
                        }

                        if (!anchorTime) continue; // skip if no valid anchor

                        const diff = dateDiff(anchorTime, event.timestamp, trans.interval.unit);

                        if (trans.interval.min !== undefined && diff < trans.interval.min) continue;
                        if (trans.interval.max !== undefined && diff > trans.interval.max) continue;
                    }

                    if (trans.match(event)) {
                        const nextAnchors = { ...anchors };
                        // update event anchor
                        nextAnchors.lastEventAnchor = event.timestamp;

                        newPaths.push({
                            state: trans.next,
                            index: index + 1,
                            matched: [...matched, event],
                            anchors: nextAnchors,
                        });
                        debugEvents?.onChangeState?.(trans.next, event);
                    }
                }
            }
        }

        paths = newPaths;
    }

    const uniqueResults = new Map<string, TimelineEntryWithIndex<T>[]>();
    for (const result of results) {
        const key = result.map((e) => e.index).join(",");
        if (!uniqueResults.has(key)) {
            uniqueResults.set(key, result);
        }
    }

    // Convert Map to array
    results.length = 0;
    uniqueResults.forEach((value) => results.push(value));
    return results;
}
