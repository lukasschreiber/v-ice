import { StructFields } from "@/data/types";
import { SkipOp, Timeline, TimelineTemplate, TimelineTemplateEventMeta, TimelineTemplateEventMetaType } from "./generation/timeline_templates";

export type State = number;
export type Transition = { [key: string]: State };
export type EventMatcher = (currentEvent: TimelineTemplateEventMeta, nextEvent?: TimelineTemplateEventMeta) => boolean;

export interface DFA {
    states: Set<State>;
    transitions: Map<State, Map<EventMatcher, State>>;
    startState: State;
    acceptStates: Set<State>;

    isAccepting(state: State): boolean;
    transition(state: State, currentEvent: TimelineTemplateEventMeta, nextEvent: TimelineTemplateEventMeta): State | undefined;
    test(events: Timeline<StructFields>): boolean;
}

export class SimpleEventDFA implements DFA {
    states: Set<State>;
    transitions: Map<State, Map<EventMatcher, State>>;
    startState: State;
    acceptStates: Set<State>;

    constructor(states: Set<State>, transitions: Map<State, Map<EventMatcher, State>>, startState: State, acceptStates: Set<State>) {
        this.states = states;
        this.transitions = transitions;
        this.startState = startState;
        this.acceptStates = acceptStates;
    }

    isAccepting(state: State): boolean {
        return this.acceptStates.has(state);
    }

    transition(state: State, currentEvent: TimelineTemplateEventMeta, nextEvent: TimelineTemplateEventMeta): State | undefined {
        const stateTransitions = this.transitions.get(state);
        if (stateTransitions) {
            for (const [matcher, nextState] of stateTransitions.entries()) {
                if (matcher(currentEvent, nextEvent)) {
                    return nextState;
                }
            }
        }
        return undefined;
    }

    test(events: Timeline<StructFields>): boolean {
        let currentState = this.startState;
        let anchor = events[0]; // anchor is always the event that entered a state

        for (const event of events) {
            const nextState = this.transition(currentState, anchor, event);
            console.log(currentState, event, nextState);
            if (nextState === undefined) {
                return false;
            }

            if (currentState !== nextState) {
                currentState = nextState;
                anchor = event;
            }

            // the timeline does not have to be consumed completely
            if (this.isAccepting(currentState)) {
                return true;
            }
        }

        return this.isAccepting(currentState);
    }
}

export function timeOfEvent(event: TimelineTemplateEventMeta): luxon.DateTime | null {
    if (event.timestamp) {
        return window.luxon.DateTime.fromISO(event.timestamp as string);
    } else {
        return null;
    }
}

export function createMatcher(event: TimelineTemplateEventMetaType): EventMatcher {
    if (typeof event === "function") {
        return event;
    } else {
        return (e) => e === event;
    }
}

export function createNegatedMatcher(event: TimelineTemplateEventMetaType): EventMatcher {
    if (typeof event === "function") {
        return (e) => !event(e);
    } else {
        return (e) => e !== event;
    }
}

export function createMatcherWithIntervalConstraint(currentEvent: TimelineTemplateEventMetaType, nextEvent: TimelineTemplateEventMetaType, interval: [number, number]): EventMatcher {
    const currentEventMatcher = createMatcher(currentEvent);
    const nextEventMatcher = createMatcher(nextEvent);

    return (current, next) => {
        if (currentEventMatcher(current) && next && nextEventMatcher(next)) {
            const currentEventTime = timeOfEvent(current);
            const nextEventTime = timeOfEvent(next);

            if (currentEventTime && nextEventTime) {
                const diff = nextEventTime.diff(currentEventTime, "seconds").seconds;
                return diff >= interval[0] && diff <= interval[1];
            }
        }

        return false;
    };
}

export function buildDfa(template: TimelineTemplate) {
    const states = new Set<State>();
    const transitions = new Map<State, Map<EventMatcher, State>>();
    const startState: State = 0;

    let statesCounter = 0;
    const afterStack: [number, number][] = [];

    for (let i = 0; i < template.length; i++) {
        const entry = template[i];
        if (entry.type_ === "event") {
            // if we expect an event we need to add a transition to the next state
            const event = entry.event;
            const currentState = statesCounter;
            const nextState = ++statesCounter;
            states.add(currentState);
            states.add(nextState);

            const currentStateTransitions = transitions.get(currentState) || new Map<EventMatcher, State>();
            if (afterStack.length > 0) {
                // combine all the intervals
                const interval = afterStack.reduce(([min, max], [a, b]) => [min + a, max + b], [0, 0]);
                // this is wrong, we need to actually enter the anchor event
                currentStateTransitions.set(createMatcherWithIntervalConstraint(event, event, interval), nextState);
            } else {
                currentStateTransitions.set(createMatcher(event), nextState);
            }

            // add the transition to stay an this state - THIS IS WRONG, NEGATING DISALLOWS ANY OTHER TRANSITION
            currentStateTransitions.set(createNegatedMatcher(event), currentState);
            transitions.set(currentState, currentStateTransitions);
        } else if (entry.type_ === "no_event") {
            throw new Error("Not implemented");
        } else if (entry.type_ === "skip") {
            // probably a stack and good interval arithmetic is needed
            if (entry.op === SkipOp.EXACTLY) {
                afterStack.push([entry.duration, entry.duration]);
            } else if (entry.op === SkipOp.AT_LEAST) {
                afterStack.push([entry.duration, Infinity]);
            } else if (entry.op === SkipOp.AT_MOST) {
                afterStack.push([0, entry.duration]);
            }
        } else if (entry.type_ === "skip_interval") {
            afterStack.push([entry.minDuration, entry.maxDuration]);
        }
    }

    // mark the last state as accepting
    const acceptStates = new Set<State>([statesCounter]);

    return new SimpleEventDFA(states, transitions, startState, acceptStates);
}

// export function matchTimeline(template_: TimelineTemplate, timeline: Timeline<StructFields>) {

// }
