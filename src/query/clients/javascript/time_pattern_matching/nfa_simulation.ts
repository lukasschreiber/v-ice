import { StructFields } from "@/data/types";
import { TimelineEntry } from "@/query/generation/timeline_templates";
import { NFAState } from "./nfa";
import { dateDiff } from "../ambient/datetime";

export type TimelineEntryWithIndex<T extends StructFields> = TimelineEntry<T> & {
    index: number; // position in timeline
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

    type Path = { state: NFAState<T>; index: number; matched: TimelineEntryWithIndex<T>[] };
    let paths: Path[] = [{ state: nfaStart, index: 0, matched: [] }];

    while (paths.length > 0) {
        const newPaths: Path[] = [];

        for (const path of paths) {
            const { state, index, matched } = path;

            // Record match if accepting
            if (state.isAccepting) {
                results.push([...matched]);
                debugEvents?.onAcceptingState?.(state, matched);
            }

            for (const trans of state.transitions) {
                if (trans.skipIf) {
                    for (let i = index; i < timeline.length; i++) {
                        if (trans.skipIf(timeline[i])) {
                            const nextPath = { state: trans.next, index: i + 1, matched: [...matched] };
                            newPaths.push(nextPath);
                            debugEvents?.onChangeState?.(trans.next, timeline[i]);
                        }
                    }
                    continue;
                }

                if (!trans.match) {
                    // Epsilon transition: explore without consuming an event
                    const nextPath = { state: trans.next, index, matched: [...matched] };
                    newPaths.push(nextPath);
                    debugEvents?.onChangeState?.(trans.next, timeline[index] ?? (null as any));
                    continue;
                }

                if (index < timeline.length) {
                    const event = timeline[index];

                    // occurrence filter
                    if (trans.occurrence === "none") continue;
                    if (trans.occurrence === "first" && index !== 0) continue;
                    if (trans.occurrence === "last" && index !== timeline.length - 1) continue;

                    // interval check (if there is a previous match)
                    if (matched.length > 0 && trans.interval) {
                        const prev = matched[matched.length - 1];
                        const diff = dateDiff(
                            { timestamp: prev.timestamp },
                            { timestamp: event.timestamp },
                            trans.interval.unit
                        );

                        if (trans.interval.min !== undefined && diff < trans.interval.min) continue;
                        if (trans.interval.max !== undefined && diff > trans.interval.max) continue;
                    }

                    if (trans.match(event)) {
                        const nextPath = {
                            state: trans.next,
                            index: index + 1,
                            matched: [...matched, event],
                        };
                        newPaths.push(nextPath);
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
