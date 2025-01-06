import { useState } from "react";
import { IEvaluation } from "../../evaluation/web/store/EvaluationContext";
import { EvaluationAction, EvaluationActionPayloads } from "v-ice/dist/evaluation_emitter";
import { getEvaluation } from "./assets/data/evaluations";
import { OverviewRow } from "./OverviewRow";

export function SingleOverview(
    props: React.HTMLProps<HTMLDivElement> & {
        evaluation: IEvaluation;
        onChangeView?: (view: string) => void;
        onChangeTask?: (task: string) => void;
    }
) {
    const { evaluation, onChangeView, onChangeTask, ...rest } = props;
    const [selectedEvent, setSelectedEvent] = useState<{
        color: string;
        name: string;
        event: EvaluationActionPayloads[EvaluationAction];
        index: number;
        taskName: string;
        taskIndex: number;
    }>();

    return (
        <div {...rest} className={`bg-white overflow-auto`}>
            <h1 className="p-2 font-bold">Single Overview for {evaluation.user.code}</h1>
            <div
                className="min-h-[100px] w-[200px] text-xs p-1 absolute top-1 right-5 bg-white/50 z-10"
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
                                        typeof selectedEvent.event[key as keyof typeof selectedEvent.event] === "string"
                                )
                                .map((key) => {
                                    return (
                                        <div key={key}>
                                            <span>{key}</span>:{" "}
                                            <span>{selectedEvent.event![key as keyof typeof selectedEvent.event]}</span>
                                        </div>
                                    );
                                })}
                    </div>
                ) : (
                    "No event selected"
                )}
            </div>
            <div>
                {evaluation.tasks &&
                    Object.entries(evaluation.tasks).map(([taskName, task]) => {
                        return (
                            <div key={taskName}>
                                <h2 className="font-semibold p-2">
                                    {getEvaluation(evaluation.user.code).survey.stages[taskName].title}
                                </h2>
                                <div className="flex flex-col gap-2 items-start">
                                    {Object.entries(task).map(([taskResultName, taskResult]) => {
                                        return (
                                            <OverviewRow
                                                task={taskResult}
                                                taskName={taskName + "_" + taskResultName}
                                                onChangeView={onChangeView}
                                                onChangeTask={onChangeTask}
                                                selectedEvent={
                                                    selectedEvent?.taskIndex === parseInt(taskResultName) &&
                                                    taskName === selectedEvent.taskName
                                                        ? selectedEvent
                                                        : undefined
                                                }
                                                setSelectedEvent={(event) => {
                                                    setSelectedEvent({
                                                        ...event,
                                                        taskName,
                                                        taskIndex: parseInt(taskResultName),
                                                    });
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
