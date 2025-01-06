import { EvaluationAction, EvaluationActionPayloads } from "v-ice/dist/evaluation_emitter";
import { msToTime } from "./utils";
import { ISerializedWorkspace } from "../../../dist/serializer";
import { useRef } from "react";

export function Timeline(
    props: React.SVGProps<SVGSVGElement> & {
        totalTime: number;
        events: { name: EvaluationAction; time: number; payload: EvaluationActionPayloads[EvaluationAction] }[];
        currentTime: number;
        onCurrentTimeChange: (time: number) => void;
        onWorkspaceSelected: (workspace: ISerializedWorkspace) => void;
        selectedEvent: { color: string; name: string; event: EvaluationActionPayloads[EvaluationAction], index: number } | undefined;
        onEventSelected: (event: {
            color: string;
            name: string;
            event: EvaluationActionPayloads[EvaluationAction];
            index: number;
        }) => void;
    }
) {
    const { events, selectedEvent, totalTime, currentTime, onEventSelected, onWorkspaceSelected, onCurrentTimeChange, ...rest } =
        props;

    const svgRef = useRef<SVGSVGElement>(null);
    const padding = 50;

    function getXPosition(time: number) {
        return (time / totalTime) * getTimelineWidth() + padding;
    }

    function getTimelineWidth() {
        return totalTime / 10000 * 120;
    }

    return (
        <svg
            ref={svgRef}
            {...rest}
            width={getTimelineWidth() + 2 * padding}
            height={100}
            onClick={(e) => {
                // if target is not svg, find the svg element
                let el = e.target as SVGElement;
                while (el.tagName !== "svg") {
                    el = el.parentElement as unknown as SVGElement;
                }
                const svg = el as SVGSVGElement;
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const cursorpt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

                // find the closest event
                const workspaceChangedEvents = events.filter((e) => e.name === "workspaceChanged");
                let minDist = Infinity;
                let closestEvent = workspaceChangedEvents[0];
                for (const event of workspaceChangedEvents) {
                    const xPosition = getXPosition(event.time);
                    const dist = Math.abs(xPosition - cursorpt.x);
                    if (dist < minDist) {
                        minDist = dist;
                        closestEvent = event;
                    }
                }

                const newWorkspaceState = (
                    closestEvent.payload as EvaluationActionPayloads[EvaluationAction.WorkspaceChanged]
                ).workspaceState;
                onWorkspaceSelected(newWorkspaceState);
                onCurrentTimeChange(closestEvent.time);
            }}
        >
            <line x1={padding} y1="80" x2={getTimelineWidth() + padding} y2="80" stroke="black" />
            <line x1={getTimelineWidth() + padding} y1="75" x2={getTimelineWidth() + padding} y2="85" stroke="black" />
            <text x={getTimelineWidth() + padding} y="95" fontSize="10" textAnchor="middle">
                {msToTime(totalTime)}
            </text>

            <line
                x1={getXPosition(currentTime)}
                y1="0"
                x2={getXPosition(currentTime)}
                y2="100"
                stroke="black"
            />
            <text x={getXPosition(currentTime) + 2} y="10" fontSize={10}>
                {currentTime} ms
            </text>

            {/* tick every 10 seconds */}
            {Array.from({ length: Math.ceil(totalTime / 10000) }, (_, i) => {
                const xPosition = getXPosition(i * 10000);
                return (
                    <g key={i}>
                        <line x1={xPosition} y1="75" x2={xPosition} y2="85" stroke="black" />
                        <text x={xPosition} y="95" fontSize="10" textAnchor="middle">
                            {msToTime(i * 10000)}
                        </text>
                    </g>
                );
            })}

            {events.map((event, index) => {
                // get the x position of the event
                // based on the time of the event
                const xPosition = getXPosition(event.time);

                const eventColors: Record<string, string> = {
                    createBlockInToolbox: "#ff0000",
                    useMagicWand: "#00ff00",
                };

                if (event.name === "workspaceChanged") {
                    return (
                        <g key={index}>
                            <circle cx={xPosition} cy="80" r="5" fill="#00000066" />
                        </g>
                    );
                }

                const color = eventColors[event.name] ?? "#0000ff";

                const eventIndex = events.indexOf(event);

                return (
                    <g
                        key={index}
                        onClick={() => {
                            onEventSelected({
                                color,
                                name: event.name,
                                event: event.payload as EvaluationActionPayloads[EvaluationAction],
                                index: eventIndex,
                            });
                        }}
                    >
                        <circle cx={xPosition} cy="65" r="5" fill={color} />
                        <line x1={xPosition} y1="65" x2={xPosition} y2="80" stroke={color} />
                        <text x={xPosition} y="50" fontSize="10" textAnchor="left" dominantBaseline="central" transform={`rotate(-30, ${xPosition}, 50)`} fontWeight={`${selectedEvent?.index === eventIndex ? "bold" : ""}`}>
                            {event.name}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
