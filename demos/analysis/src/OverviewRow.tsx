import { useRef } from "react";
import { IEvaluation, IEvaluationTaskResult } from "../../evaluation/web/store/EvaluationContext";
import { WorkspaceImage } from "./WorkspaceImage";
import { InfoTable } from "./InfoTable";
import { Timeline } from "./Timeline";
import { EvaluationAction, EvaluationActionPayloads } from "v-ice/dist/evaluation_emitter";

export function OverviewRow(
    props: React.HTMLProps<HTMLDivElement> & {
        task: IEvaluationTaskResult;
        evaluation?: IEvaluation;
        taskName: string;
        onChangeView?: (view: string) => void;
        onChangeTask?: (task: string) => void;
        onChangeUser?: (user: string) => void;
        selectedEvent?: {
            color: string;
            name: string;
            event: EvaluationActionPayloads[EvaluationAction];
            index: number;
        };
        setSelectedEvent: (event: {
            color: string;
            name: string;
            event: EvaluationActionPayloads[EvaluationAction];
            index: number;
        }) => void;
    }
) {
    const { task, onChangeView, onChangeTask, onChangeUser, evaluation, selectedEvent, setSelectedEvent, taskName, ...rest } = props;
    const ref = useRef<HTMLDivElement>(null);
    return (
        <div {...rest} className={`bg-white overflow-auto`}>
            <div className="flex flex-row gap-2">
                <div className="w-[400px]">
                    <WorkspaceImage state={task.resultWorkspace} lazyLoadParentRef={ref} />
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-2 items-start text-sm">
                        <InfoTable key={taskName} solution={task} className="ml-[50px]" />
                        {evaluation && <InfoTable key={evaluation.user.code} evaluation={evaluation} />}
                        <button
                            className="border border-gray-600 bg-gray-200 px-1"
                            onClick={() => {
                                onChangeView && onChangeView("single");
                                onChangeTask && onChangeTask(taskName);
                                onChangeUser && evaluation && onChangeUser(evaluation.user.code);
                            }}
                        >
                            Open Single
                        </button>
                    </div>
                    <Timeline
                        key={task + "timeline"}
                        totalTime={task.time}
                        events={task.events}
                        currentTime={0}
                        onCurrentTimeChange={() => {}}
                        onWorkspaceSelected={() => {}}
                        selectedEvent={selectedEvent}
                        onEventSelected={setSelectedEvent}
                    />
                </div>
            </div>
        </div>
    );
}
