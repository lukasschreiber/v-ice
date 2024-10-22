import { IEvaluation } from "../../evaluation/web/store/EvaluationContext";
import { InfoTable } from "./InfoTable";
import { WorkspaceImage } from "./WorkspaceImage";

export function TaskOverviewSolutions(
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

    return (
        <div {...rest} className={`bg-white overflow-auto`}>
            <h1 className="p-2 font-bold">
                Task Overview Solutions Only for Task {taskName}_{taskIndex}
            </h1>
            <div className="flex flex-col gap-2 flex-wrap">
                {evaluations.filter((evaluation) => evaluation.user.code[0] === taskCategory).map((evaluation, index) => {
                    const user = evaluation.user;
                    const task = evaluation.tasks[taskName]?.[taskIndex];
                    if (!task) {
                        return null;
                    }

                    return (
                        <div key={index} className="p-2 border-b flex flex-col gap-2">
                            <div className="flex gap-2">
                            <h2 className="font-bold">{user.code}</h2>
                                <button
                                    className="border border-gray-600 bg-gray-200 px-1"
                                    onClick={() => {
                                        onChangeView && onChangeView("single");
                                        onChangeTask && onChangeTask(taskName+"_"+taskIndex);
                                        onChangeUser && evaluation && onChangeUser(evaluation.user.code);
                                    }}
                                >
                                    Open Single
                                </button>
                            </div>
                            <InfoTable key={taskName} solution={task} evaluation={evaluation} />
                            <div className="p-2">
                                <WorkspaceImage state={task.resultWorkspace} scale={0.7} className="w-full" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
