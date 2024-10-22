import { Canvas, DataTable, ISerializedWorkspace, useQuery, useWorkspace } from "@nephro-react/filters";
import { IEvaluation, IEvaluationTaskResult } from "@nephro-react/filters/demos/evaluation/web/store/EvaluationContext";
import { IEvaluationInteractiveStage, IEvaluationTask, getEvaluation } from "./assets/data/evaluations";
import { EvaluationAction, EvaluationActionPayloads } from "@nephro-react/filters/dist/evaluation_emitter";
import { useEffect, useRef, useState } from "react";
import { Timeline } from "./Timeline";
import { InfoTable } from "./InfoTable";
import { SingleOverview } from "./SingleOverview";
import { TaskOverview } from "./TaskOverview";
import { WorkspaceImage } from "./WorkspaceImage";
import { TaskOverviewSolutions } from "./TaskOverviewSolutions";
import { ScreenshotModal } from "../../dev/src/components/ScreenshotModal";

const evaluations = import.meta.glob("/src/assets/results/*.json", { eager: true });

for (const path in evaluations) {
    if (!(evaluations[path] as IEvaluation).tasks) {
        delete evaluations[path];
    }
}

function App() {
    const { setQuerySource, setTargets } = useQuery();
    const { load, clear } = useWorkspace();
    const controlRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(document.documentElement.clientWidth);
    const [height, setHeight] = useState(document.documentElement.clientHeight - 150); // TODO: this is a hack
    const [screenshotModeEnabled, setScreenshotModeEnabled] = useState(false);

    const [evaFile, setEvaFile] = useState<string>(Object.keys(evaluations)[0]);
    const [evaTask, setEvaTask] = useState<string>(
        Object.keys((evaluations[Object.keys(evaluations)[0]] as IEvaluation).tasks)[0] + "_0"
    );
    const [currentAssignment, setCurrentAssignment] = useState<IEvaluationTask>();
    const [currentSolution, setCurrentSolution] = useState<IEvaluationTaskResult>();
    const [currentLoadedTable, setCurrentLoadedTable] = useState<string>();
    const [currentWorkspaceState, setCurrentWorkspaceState] = useState<ISerializedWorkspace>();
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [selectedEvent, setSelectedEvent] = useState<{
        color: string;
        name: string;
        event: EvaluationActionPayloads[EvaluationAction];
        index: number;
    }>();

    const timelineRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedView, setSelectedView] = useState<"single" | "overview" | "task_overview" | "task_results_only">(
        "single"
    );
    const animationInterval = useRef<NodeJS.Timeout>();

    useEffect(() => {
        console.log(evaFile, evaTask);
        const newSolution = (evaluations[evaFile] as IEvaluation).tasks[evaTask.split("_")[0]][evaTask.split("_")[1]];
        const newAssignment = (
            getEvaluation(evaFile.replace(/.*\//, ""))?.survey.stages[
                evaTask.split("_")[0]
            ] as IEvaluationInteractiveStage
        ).tasks[parseInt(evaTask.split("_")[1])];
        setCurrentAssignment(newAssignment);

        // remove all events that occured less than 250ms after the previous event
        newSolution.events = newSolution.events.filter((event, index, events) => {
            // remove events that occured after the end of the solution
            if (event.time > newSolution.time) return false;

            if (index === events.length - 1) return true;
            if (event.name !== "workspaceChanged") return true;
            if (events[index + 1].name !== "workspaceChanged") return true;

            if (events[index + 1].time - event.time < 250) return false;

            return true;
        });
        setCurrentSolution(newSolution);

        if (selectedView === "single") {
            const code = evaFile.replace(/.*\//, "");

            if (newAssignment?.source + code[0] !== currentLoadedTable) {
                setCurrentLoadedTable(newAssignment.source + code[0]);

                const source = getEvaluation(code)?.sources[newAssignment.source];
                if (source) {
                    setQuerySource(DataTable.fromJSON(source));
                }
            }

            const targets: Record<string, string> = {};

            let i = 0;
            for (const target of newAssignment.targets) {
                targets[`target${i}`] = target.name;
                i++;
            }
            setTargets(targets);
            clear();
            setCurrentWorkspaceState(newSolution.resultWorkspace);
            setCurrentTime(newSolution.time);
        }
    }, [evaFile, evaTask, selectedView]);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (currentWorkspaceState) {
            const promise = new Promise((resolve) => {
                load(currentWorkspaceState);
                resolve(null);
            });
            promise.then(() => {
                // console.log("workspace loaded");
            });
        }
    }, [currentWorkspaceState]);

    function handleResize() {
        const controlHeight = controlRef.current?.clientHeight ?? 0;
        setHeight(document.documentElement.clientHeight - controlHeight);
        setWidth(document.documentElement.clientWidth);
    }

    useEffect(() => {
        window.addEventListener("keydown", handleKeys);

        if (isPlaying) {
            timelineRef.current?.scrollTo({
                left: (currentTime / (currentSolution?.time ?? 1)) * timelineRef.current.scrollWidth + 0.5,
                behavior: "instant",
            });
        }
        return () => {
            window.removeEventListener("keydown", handleKeys);
        };
    }, [currentSolution, currentTime]);

    function handleKeys(e: KeyboardEvent) {
        if (!currentSolution) return;
        const workspaceChangedEvents = currentSolution?.events.filter((e) => e.name === "workspaceChanged");

        if (e.key === "ArrowRight") {
            const nextEvent = workspaceChangedEvents.find((e) => e.time > currentTime && e.time < currentSolution.time);
            if (nextEvent) {
                setCurrentWorkspaceState(
                    (nextEvent.payload as EvaluationActionPayloads[EvaluationAction.WorkspaceChanged]).workspaceState
                );
                setCurrentTime(nextEvent.time);
            } else {
                setCurrentWorkspaceState(currentSolution.resultWorkspace);
                setCurrentTime(currentSolution.time);
            }
            e.preventDefault();
        } else if (e.key === "ArrowLeft") {
            const prevEvent = workspaceChangedEvents.reverse().find((e) => e.time < currentTime);
            if (prevEvent) {
                setCurrentWorkspaceState(
                    (prevEvent.payload as EvaluationActionPayloads[EvaluationAction.WorkspaceChanged]).workspaceState
                );
                setCurrentTime(prevEvent.time);
            }
            e.preventDefault();
        }
    }

    return (
        <>
            <div className="relative h-full max-w-full">
                <div style={{ width: `${width}px`, height: `${height}px` }}>
                    {selectedView === "overview" ? (
                        <SingleOverview
                            onChangeView={(view) => setSelectedView(view as "single" | "overview" | "task_overview")}
                            onChangeTask={(task) => setEvaTask(task)}
                            evaluation={evaluations[evaFile] as IEvaluation}
                            style={{ height: `${height}px` }}
                        />
                    ) : selectedView === "task_overview" ? (
                        <TaskOverview
                            evaluations={Object.values(evaluations) as IEvaluation[]}
                            taskName={evaTask.split("_")[0]}
                            taskIndex={parseInt(evaTask.split("_")[1])}
                            style={{ height: `${height}px` }}
                            taskCategory={evaFile.replace(/.*\//, "")[0]}
                            onChangeView={(view) => setSelectedView(view as "single" | "overview" | "task_overview")}
                            onChangeTask={(task) => setEvaTask(task)}
                            onChangeUser={(user) => {
                                setEvaFile(Object.keys(evaluations).find((key) => key.includes(user)) ?? "");
                            }}
                        />
                    ) : selectedView === "task_results_only" ? (
                        <TaskOverviewSolutions
                            evaluations={Object.values(evaluations) as IEvaluation[]}
                            taskName={evaTask.split("_")[0]}
                            taskIndex={parseInt(evaTask.split("_")[1])}
                            style={{ height: `${height}px` }}
                            taskCategory={evaFile.replace(/.*\//, "")[0]}
                            onChangeView={(view) => setSelectedView(view as "single" | "overview" | "task_overview")}
                            onChangeTask={(task) => setEvaTask(task)}
                            onChangeUser={(user) => {
                                setEvaFile(Object.keys(evaluations).find((key) => key.includes(user)) ?? "");
                            }}
                        />
                    ) : (
                        <div>
                            <div className="flex flex-col gap-1 z-[1000] absolute top-1 right-1 bg-white/50">
                                <InfoTable solution={currentSolution} className="" />
                                <div
                                    className="min-h-[100px] text-xs p-1"
                                    style={{ border: `1px solid ${selectedEvent?.color ?? "black"}` }}
                                >
                                    {selectedEvent ? (
                                        <div>
                                            <div className="font-bold">{selectedEvent.name}</div>
                                            {selectedEvent.event &&
                                                Object.keys(selectedEvent.event as object)
                                                    .filter(
                                                        (key) =>
                                                            selectedEvent.event &&
                                                            typeof selectedEvent.event[
                                                                key as keyof typeof selectedEvent.event
                                                            ] === "string"
                                                    )
                                                    .map((key) => {
                                                        return (
                                                            <div key={key}>
                                                                <span>{key}</span>:{" "}
                                                                <span>
                                                                    {
                                                                        selectedEvent.event![
                                                                            key as keyof typeof selectedEvent.event
                                                                        ]
                                                                    }
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                        </div>
                                    ) : (
                                        "No event selected"
                                    )}
                                </div>
                                <div className="border border-black">
                                    {currentSolution?.resultWorkspace && (
                                        <WorkspaceImage state={currentSolution.resultWorkspace} />
                                    )}
                                </div>
                            </div>
                            <div className="canvas">
                                <Canvas
                                    width={width}
                                    height={height - (timelineRef?.current?.offsetHeight ?? 100)}
                                    language={"en"}
                                />
                            </div>
                            <div className="w-full overflow-auto mt-auto" ref={timelineRef}>
                                {currentSolution && (
                                    <Timeline
                                        events={currentSolution.events}
                                        currentTime={currentTime}
                                        onCurrentTimeChange={setCurrentTime}
                                        totalTime={currentSolution.time}
                                        onWorkspaceSelected={setCurrentWorkspaceState}
                                        onEventSelected={setSelectedEvent}
                                        selectedEvent={selectedEvent}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div ref={controlRef} className="max-h-[150px] min-h-[150px] flex flex-col relative">
                    <div className="flex flex-row gap-4">
                        <div className="flex flex-col p-2 gap-2">
                            <div className="flex flex-row gap-2">
                                <select
                                    value={evaFile}
                                    onChange={(e) => setEvaFile(e.target.value)}
                                    className="border border-gray-600"
                                >
                                    {evaluations &&
                                        Object.keys(evaluations)
                                            .filter((key) => (evaluations[key] as IEvaluation).tasks)
                                            .map((key) => {
                                                return (
                                                    <option key={key} value={key}>
                                                        {key.replace(/.*\//, "")}
                                                    </option>
                                                );
                                            })}
                                </select>
                                <select
                                    value={evaTask}
                                    onChange={(e) => setEvaTask(e.target.value)}
                                    className="border border-gray-600"
                                >
                                    {evaluations &&
                                        (evaluations[evaFile] as IEvaluation).tasks &&
                                        Object.entries((evaluations[evaFile] as IEvaluation).tasks)
                                            .flatMap(([key, value]) => {
                                                const entries = Object.entries(value);
                                                return entries.map(([k, v]) => {
                                                    return [key + "_" + k, v];
                                                }) as [string, any][];
                                            })
                                            .map(([key], index) => {
                                                return (
                                                    <option key={index} value={key}>
                                                        {key}
                                                    </option>
                                                );
                                            })}
                                </select>
                                <select
                                    value={selectedView}
                                    onChange={(e) =>
                                        setSelectedView(e.target.value as "single" | "overview" | "task_overview")
                                    }
                                    className="border border-gray-600"
                                >
                                    <option value="single">Single Task</option>
                                    <option value="overview">All Solutions of one User</option>
                                    <option value="task_overview">All Solutions of one Task</option>
                                    <option value="task_results_only">All Solutions of one Task (Results Only)</option>
                                </select>
                                <button
                                    className="border border-gray-600 bg-gray-200 px-1"
                                    onClick={() => {
                                        if (currentSolution) {
                                            setCurrentWorkspaceState(currentSolution.resultWorkspace);
                                            setCurrentTime(currentSolution.time);
                                        }
                                    }}
                                >
                                    Load Result Workspace
                                </button>
                                <button 
                                    className="border border-gray-600 bg-gray-200 px-1"
                                    onClick={() => setScreenshotModeEnabled(true)}
                                >
                                    Screenshot Mode
                                </button>
                                {selectedView === "single" && (
                                    <>
                                        <button
                                            className="border border-gray-600 bg-gray-200 px-1 w-[26px]"
                                            disabled={isPlaying}
                                            onClick={() => {
                                                // play the solution by moving the workspace to the state at each event
                                                const events = currentSolution?.events;
                                                if (!events) return;

                                                const eventAtCurrentTime = events.find(
                                                    (event) => event.time >= currentTime
                                                );
                                                const startIndex = eventAtCurrentTime
                                                    ? events.indexOf(eventAtCurrentTime)
                                                    : 0;
                                                // if startIndex is the last event, start from the beginning
                                                let i = startIndex === events.length - 1 ? 0 : startIndex;
                                                setIsPlaying(true);
                                                animationInterval.current = setInterval(() => {
                                                    if (i >= currentSolution.events.length) {
                                                        clearInterval(animationInterval.current);
                                                        return;
                                                    }
                                                    const event = currentSolution?.events[i];
                                                    setCurrentWorkspaceState(
                                                        (
                                                            event.payload as EvaluationActionPayloads[EvaluationAction.WorkspaceChanged]
                                                        ).workspaceState
                                                    );
                                                    setCurrentTime(event.time);
                                                    i++;

                                                    if (i === currentSolution.events.length) {
                                                        setIsPlaying(false);
                                                        clearInterval(animationInterval.current);
                                                        setCurrentWorkspaceState(currentSolution.resultWorkspace);
                                                    }
                                                }, 100);
                                            }}
                                        >
                                            ▶
                                        </button>
                                        <button
                                            className="border border-gray-600 bg-gray-200 px-1 w-[26px]"
                                            style={{ fontFamily: "Segoe UI Symbol" }}
                                            disabled={!isPlaying}
                                            onClick={() => {
                                                setIsPlaying(false);
                                                clearInterval(animationInterval.current);
                                            }}
                                        >
                                            ⏸
                                        </button>
                                    </>
                                )}
                            </div>
                            <div>{currentAssignment?.query}</div>
                        </div>
                    </div>
                    <div className="p-2">
                        {currentSolution && <InfoTable evaluation={evaluations[evaFile] as IEvaluation} />}
                    </div>
                </div>
            </div>
            <ScreenshotModal open={screenshotModeEnabled} onClose={() => setScreenshotModeEnabled(false)} selector=".canvas .injectionDiv > .blocklySvg" />
        </>
    );
}

export default App;
