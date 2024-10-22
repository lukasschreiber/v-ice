import { useState } from "react";
import { IEvaluation } from "../../evaluation/web/store/EvaluationContext";
import { EvaluationAction, EvaluationActionPayloads } from "@nephro-react/filters/dist/evaluation_emitter";
import { OverviewRow } from "./OverviewRow";

export function TaskOverview(
    props: React.HTMLProps<HTMLDivElement> & {
        evaluations: IEvaluation[];
        onChangeView?: (view: string) => void;
        onChangeTask?: (task: string) => void;
        onChangeUser?: (user: string) => void;
        taskName: string;
        taskIndex: number;
        taskCategory: string;
    }
) {
    const { evaluations, taskName, taskCategory, taskIndex, onChangeUser, onChangeTask, onChangeView, ...rest } = props;
    const [selectedEvent, setSelectedEvent] = useState<{
        color: string;
        name: string;
        event: EvaluationActionPayloads[EvaluationAction];
        index: number;
        code: string;
    }>();

    return (
        <div {...rest} className={`bg-white overflow-auto`}>
            <h1 className="p-2 font-bold">
                Task Overview for Task {taskName}_{taskIndex}
            </h1>
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
                {evaluations
                    .filter((evaluation) => evaluation.user.code[0] === taskCategory)
                    .map((evaluation) => {
                        const task = evaluation.tasks?.[taskName]?.[taskIndex];
                        return (
                            <div key={evaluation.user.code}>
                                <h2 className="font-semibold p-2">{evaluation.user.code}</h2>
                                {task ? (
                                    <div className="flex flex-col gap-2 items-start">
                                        <OverviewRow
                                            task={task}
                                            taskName={taskName+"_"+taskIndex}
                                            evaluation={evaluation}
                                            onChangeUser={onChangeUser}
                                            onChangeView={onChangeView}
                                            onChangeTask={onChangeTask}
                                            selectedEvent={
                                                selectedEvent?.code === evaluation.user.code ? selectedEvent : undefined
                                            }
                                            setSelectedEvent={(event) => {
                                                setSelectedEvent({
                                                    ...event,
                                                    code: evaluation.user.code,
                                                });
                                            }}
                                        />
                                    </div>
                                ) : (
                                    "No data for this task"
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
