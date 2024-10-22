import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEvaluationState } from "../store/useEvaluationHook";
import { useEffect, useState } from "react";
import {
    IEvaluationData,
    IEvaluationInteractiveStage,
    IEvaluationQuestionaireLikertStage,
    IEvaluationQuestionaireStage,
    IEvaluationStage,
    getEvaluation,
} from "../../assets/data/evaluations";
import { QuestionairePage } from "./QuestionairePage";
import { Button } from "../common/Button";
import { InteractiveStagePage } from "./InteractiveStagePage";
import { ConsentPage } from "./ConsentPage";
import { ProgressBar } from "../common/ProgressBar";
import { LikertQuestionairePage } from "./LikertQuestionairePage";
import { submitEvaluation } from "../utils/api";

export function EvaluationPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { setEvaluationProperty, evaluation } = useEvaluationState();
    const enteredCode = searchParams.get("code");
    const forceNewCode = searchParams.get("force");
    const { stage } = useParams();
    const { taskId } = useParams();
    const [evaluationDefinition, setEvaluationDefinition] = useState<IEvaluationData | null>(
        evaluation.user?.code ? getEvaluation(evaluation.user?.code) : null
    );
    const [stageDefinition, setStageDefinition] = useState<IEvaluationStage | null>(
        evaluation.user?.code ? getEvaluation(evaluation.user?.code).survey.stages[stage!] : null
    );
    const navigate = useNavigate();

    useEffect(() => {
        setEvaluationDefinition(getEvaluation(evaluation.user?.code || ""));
        setStageDefinition(evaluation.user?.code ? getEvaluation(evaluation.user?.code).survey.stages[stage!] : null);
    }, [evaluation.user?.code, stage]);

    useEffect(() => {
        if (!evaluation.user?.code && !enteredCode) {
            // window.location.href = "/"; // does not work with navigate for some reason
            navigate("/");
        } else if (!evaluation.user?.consentGiven && evaluationDefinition) {
            // find the first consent stage
            const consentStage = Object.keys(evaluationDefinition.survey.stages).find(
                (key) => evaluationDefinition!.survey.stages[key].kind === "consent"
            );
            navigate(`/evaluation/${consentStage}`);
        }
    }, [
        stage,
        evaluation.user?.code,
        taskId,
        evaluation.user?.consentGiven,
        evaluationDefinition,
        navigate,
        enteredCode,
    ]);

    useEffect(() => {
        if (enteredCode && (!evaluation.user?.code || forceNewCode)) setEvaluationProperty("user.code", enteredCode);
        setEvaluationDefinition(getEvaluation(evaluation.user?.code || ""));
        setStageDefinition(evaluation.user?.code ? getEvaluation(evaluation.user?.code).survey.stages[stage!] : null);
        setSearchParams("");
    }, [enteredCode]);

    function isAllowedToNavigateToNextStage() {
        if (!evaluationDefinition || !stage) return false;
        const currentStage = evaluationDefinition.survey.stages[stage!];

        if (currentStage.kind === "consent") {
            return evaluation.user?.consentGiven;
        }

        if (currentStage.kind === "questionaire" || currentStage.kind === "questionaire-likert") {
            const currentStageQuestions = (currentStage as IEvaluationQuestionaireStage).questions;
            if (currentStageQuestions.every((question) => question.optional)) return true;
            if (!evaluation.results?.[stage]) return false;
            for (const question of currentStageQuestions) {
                const answer = evaluation.results[stage][question.name]?.answer;
                if (!question.optional) {
                    if (!answer) return false;
                    if (Array.isArray(answer) && answer.length === 0) return false;
                }
            }
        }

        if (currentStage.kind === "interactive") {
            if (taskId !== undefined) {
                const currentTaskIndex = parseInt(taskId);
                if (!evaluation.tasks?.[stage] || !evaluation.tasks[stage][currentTaskIndex]) return false;
            } else {
                return false;
            }
        }

        return true;
    }

    function navigateToNextStage() {
        if (!evaluationDefinition || !stage) return;
        const nextStageIndex = Object.keys(evaluationDefinition.survey.stages).findIndex((key) => key === stage) + 1;
        const nextStageKey = Object.keys(evaluationDefinition.survey.stages)[nextStageIndex];
        const nextStage = evaluationDefinition.survey.stages[nextStageKey];
        const currentStage = evaluationDefinition.survey.stages[stage!];

        if (currentStage.kind === "interactive") {
            const currentStageTasks = (currentStage as IEvaluationInteractiveStage).tasks;
            if (taskId !== undefined) {
                const currentTaskIndex = parseInt(taskId);
                if (currentTaskIndex < currentStageTasks.length - 1) {
                    navigate(`/evaluation/${stage}/${currentTaskIndex + 1}`);
                    return;
                }
            }
        }

        if (nextStageIndex === Object.keys(evaluationDefinition.survey.stages).length) {
            navigate("/submit");
        } else {
            if (nextStage.kind === "interactive") {
                navigate(`/evaluation/${nextStageKey}/0`);
            } else {
                navigate(`/evaluation/${nextStageKey}`);
            }
        }

        // backup the current progress
        if (evaluation.user?.code && evaluation.user?.consentGiven) {
            submitEvaluation(evaluation);
        }
    }

    return (
        <>
            {stageDefinition && evaluationDefinition && (
                <div className="h-screen flex flex-col">
                    <div className="shadow-lg p-2 px-4 flex flex-col gap-5 z-[100001]">
                        <div className=" flex flex-row justify-between items-start">
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">{stageDefinition.title}</h1>
                                <p>Zugangscode: {evaluation.user?.code}</p>
                            </div>
                            <Button
                                disabled={!isAllowedToNavigateToNextStage()}
                                onClick={navigateToNextStage}
                                className="!p-2 !px-5 font-semibold"
                            >
                                Weiter
                            </Button>
                        </div>
                        {stage && (
                            <ProgressBar evaluationDefinition={evaluationDefinition} stage={stage} taskId={taskId} />
                        )}
                    </div>
                    <div className="overflow-hidden flex flex-col h-full relative">
                        {stageDefinition.kind === "questionaire" && (
                            <QuestionairePage
                                stage={stageDefinition as IEvaluationQuestionaireStage}
                                stageKey={stage!}
                            />
                        )}
                        {stageDefinition.kind === "questionaire-likert" && (
                            <LikertQuestionairePage
                                stage={stageDefinition as IEvaluationQuestionaireLikertStage}
                                stageKey={stage!}
                            />
                        )}
                        {stageDefinition.kind === "interactive" && (
                            <InteractiveStagePage
                                stageDefinition={stageDefinition as IEvaluationInteractiveStage}
                                data={evaluationDefinition}
                                taskId={parseInt(taskId || "0")}
                                stageKey={stage!}
                            />
                        )}
                        {stageDefinition.kind === "consent" && <ConsentPage />}
                    </div>
                </div>
            )}
        </>
    );
}
