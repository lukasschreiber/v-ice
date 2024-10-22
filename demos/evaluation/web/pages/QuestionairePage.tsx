import {
    IEvaluationCheckboxListQuestion,
    IEvaluationQuestionaireStage,
    IEvaluationRadioListQuestion,
    IEvaluationSelectQuestion,
    IEvaluationTextQuestion,
    IEvaluationTextareaQuestion,
} from "../../assets/data/evaluations";
import { RadioList } from "../common/RadioList";
import { CheckboxList } from "../common/CheckboxList";
import { Field } from "../common/Field";
import { useEvaluationState } from "../store/useEvaluationHook";

export function QuestionairePage(props: { stage: IEvaluationQuestionaireStage; stageKey: string }) {
    const { setEvaluationProperty, evaluation } = useEvaluationState();

    function renderQuestion(
        question:
            | IEvaluationRadioListQuestion
            | IEvaluationCheckboxListQuestion
            | IEvaluationSelectQuestion
            | IEvaluationTextQuestion
            | IEvaluationTextareaQuestion,
        index: number
    ) {
        const text = `${index + 1}. ${question.text}`;
        if (question.kind === "radio-list") {
            return (
                <RadioList
                    label={text}
                    options={question.options}
                    key={index}
                    value={evaluation.results?.[props.stageKey]?.[question.name]?.answer as string | undefined}
                    onValueUpdate={(value) =>
                        setEvaluationProperty(`results.${props.stageKey}.${question.name}.answer`, value)
                    }
                />
            );
        } else if (question.kind === "checkbox-list") {
            return (
                <CheckboxList
                    label={text}
                    options={question.options}
                    key={index}
                    values={evaluation.results?.[props.stageKey]?.[question.name]?.answer as string[] | undefined}
                    onValueUpdate={(value) =>
                        setEvaluationProperty(`results.${props.stageKey}.${question.name}.answer`, value)
                    }
                />
            );
        } else if (question.kind === "select") {
            return (
                <Field label={text} key={index}>
                    <select
                        value={evaluation.results?.[props.stageKey]?.[question.name]?.answer as string | undefined}
                        className="outline-none border border-gray-300 p-1 rounded-md max-w-[300px]"
                        onChange={(e) => {
                            setEvaluationProperty(`results.${props.stageKey}.${question.name}.answer`, e.target.value);
                        }}
                    >
                        {question.options.map((option) => (
                            <option value={option} key={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </Field>
            );
        } else if (question.kind === "text") {
            return (
                <Field label={text} key={index}>
                    <input
                        type="text"
                        placeholder={question.placeholder}
                        className="outline-none border border-gray-300 p-1 rounded-md max-w-[300px]"
                        value={
                            (evaluation.results?.[props.stageKey]?.[question.name]?.answer as string | undefined) || ""
                        }
                        onChange={(e) => {
                            setEvaluationProperty(`results.${props.stageKey}.${question.name}.answer`, e.target.value);
                        }}
                    />
                </Field>
            );
        } else if (question.kind === "textarea") {
            return (
                <Field label={text} key={index}>
                    <textarea
                        placeholder={question.placeholder}
                        rows={question.lines}
                        className="outline-none border border-gray-300 p-1 rounded-md"
                        value={
                            (evaluation.results?.[props.stageKey]?.[question.name]?.answer as string | undefined) || ""
                        }
                        onChange={(e) => {
                            setEvaluationProperty(`results.${props.stageKey}.${question.name}.answer`, e.target.value);
                        }}
                    />
                </Field>
            );
        }
    }

    return (
        <div className="overflow-auto flex flex-col h-full p-4 gap-4 bg-gray-100 items-center">
            {props.stage.questions.map((question, index) => {
                return (
                    <div className="p-6 shadow-sm bg-white rounded-md max-w-[80%] w-full" key={index}>
                        {renderQuestion(
                            question as
                                | IEvaluationRadioListQuestion
                                | IEvaluationCheckboxListQuestion
                                | IEvaluationSelectQuestion
                                | IEvaluationTextQuestion,
                            index
                        )}
                    </div>
                );
            })}
        </div>
    );
}
