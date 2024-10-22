import { HTMLProps } from "react";
import {
    IEvaluationData,
    IEvaluationInteractiveStage,
    IEvaluationQuestionaireStage,
} from "../../assets/data/evaluations";
import { useEvaluationState } from "../store/useEvaluationHook";

export function ProgressBar(
    props: HTMLProps<HTMLDivElement> & { evaluationDefinition: IEvaluationData; stage: string; taskId?: string }
) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { evaluationDefinition, stage, className, taskId, ...rest } = props;
    const { evaluation } = useEvaluationState();

    function getLenghtOfStage(stage: string) {
        const stageDefinition = evaluationDefinition.survey.stages[stage];
        if (stageDefinition.kind === "consent") return 1;
        if (stageDefinition.kind === "questionaire" || stageDefinition.kind === "questionaire-likert") {
            return (stageDefinition as IEvaluationQuestionaireStage).questions.length;
        }
        if (stageDefinition.kind === "interactive") {
            return (stageDefinition as IEvaluationInteractiveStage).tasks.length * 4; // tasks take longer than questions
        }

        return 0;
    }

    function getTotalLength() {
        return Object.keys(evaluationDefinition.survey.stages).reduce((acc, stage) => {
            return getLenghtOfStage(stage) + acc;
        }, 0);
    }

    function getProgressWithinStage(stage: string) {
        const stageDefinition = evaluationDefinition.survey.stages[stage];
        if (stageDefinition.kind === "consent") {
            if (evaluation.user?.consentGiven) return 1;
        }

        if (stageDefinition.kind === "questionaire" || stageDefinition.kind === "questionaire-likert") {
            const currentStageQuestions = (stageDefinition as IEvaluationQuestionaireStage).questions;
            if (!evaluation.results?.[stage]) return 0;
            const answeredQuestions = currentStageQuestions.filter((question) => {
                const answer = evaluation.results?.[stage][question.name]?.answer;
                return answer && (!Array.isArray(answer) || answer.length > 0);
            });

            return answeredQuestions.length;
        }

        if (stageDefinition.kind === "interactive") {
            const currentStageTasks = (stageDefinition as IEvaluationInteractiveStage).tasks;

            // count all answered tasks, if they are answered the task object exists
            const answeredTasks = currentStageTasks.filter((_, index) => {
                return evaluation.tasks?.[stage]?.[index] !== undefined;
            });

            return answeredTasks.length * 4;
        }

        return 0;
    }

    function getStartOfStage(stage: string) {
        const index = Object.keys(evaluationDefinition.survey.stages).findIndex((key) => key === stage);
        return Object.keys(evaluationDefinition.survey.stages)
            .slice(0, index)
            .reduce((acc, currentStage) => {
                if (currentStage === stage) return acc;
                return getLenghtOfStage(currentStage) + acc;
            }, 0);
    }

    return (
        <div {...rest} className={`${className} flex flex-col gap-0.5 w-full items-center text-sm`}>
            <div {...rest} className={`${className} flex flex-row gap-0.5 w-full items-center text-sm`}>
                {Object.entries(evaluationDefinition.survey.stages).map(([key, stageDefinition]) => (
                    <div
                        key={stageDefinition.title}
                        className={`${
                            key === stage ? "font-semibold h-8" : ""
                        } flex gap-0.5 items-center px-1 py-0.5 !bg-primary-100 rounded h-6 text-primary-800`}
                        style={{
                            width: `${(getLenghtOfStage(key) / getTotalLength()) * 100}%`,
                            background: `linear-gradient(to right, rgb(var(--color-primary-400)), rgb(var(--color-primary-400)) ${
                                (getProgressWithinStage(key) / getLenghtOfStage(key)) * 100
                            }%, transparent ${
                                (getProgressWithinStage(key) / getLenghtOfStage(key)) * 100
                            }%, transparent)`, // key === stage ? "rgb(var(--color-primary-400))" : "rgb(var(--color-primary-400))"
                        }}
                    >
                        {key === stage && (
                            <div>
                                {(
                                    ((getStartOfStage(key) + getProgressWithinStage(key)) / getTotalLength()) *
                                    100
                                ).toFixed(0)}
                                %
                            </div>
                        )}
                    </div>
                ))}
            </div>{" "}
            <div {...rest} className={`${className} relative text-sm w-full h-5 text-primary-600`}>
                {Object.entries(evaluationDefinition.survey.stages).map(([key, stageDefinition]) => (
                    <div
                        key={stageDefinition.title}
                        className={`absolute ${key === stage ? "" : "hidden"} pl-1`}
                        style={{
                            left: `${(getStartOfStage(key) / getTotalLength()) * 100}%`,
                        }}
                    >
                        {stageDefinition.title}
                    </div>
                ))}
            </div>
        </div>
    );
}
