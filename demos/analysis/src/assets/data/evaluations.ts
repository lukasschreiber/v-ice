import laypersonEvaluation from "./laypersons.json" assert { type: "json" };
import ibdEvaluation from "./ibd.json" assert { type: "json" };
import ckdEvaluation from "./ckd.json" assert { type: "json" };
import { TableSaveFile } from "@nephro-react/filters";

export interface IEvaluationData {
    sources: Record<string, TableSaveFile>;
    survey: {
        meta: {
            language: string;
        }
        stages: Record<string, IEvaluationStage>;
    }
}

export interface IEvaluationStage {
    title: string;
    kind: string;
}

export interface IEvaluationQuestionaireStage extends IEvaluationStage {
    kind: "questionaire";
    questions: IEvaluationQuestion[];
}

export interface IEvaluationQuestionaireLikertStage extends IEvaluationStage {
    kind: "questionaire-likert";
    questions: IEvaluationLikertQuestion[];
}

export interface IEvaluationConsentStage extends IEvaluationStage {
    kind: "consent";
}

export interface IEvaluationInteractiveStage extends IEvaluationStage {
    kind: "interactive";
    learning?: boolean;
    tasks: IEvaluationTask[];
}

export interface IEvaluationTask {
    query: string;
    source: string;
    hidden: undefined | boolean;
    solutionLink: undefined | string;
    targets: { name: string; ids: number[] }[];
}

export interface IEvaluationQuestion {
    name: string,
    text: string,
    kind: string,
    IAmNotSureOption?: boolean,
    optional?: boolean,
}

export interface IEvaluationLikertQuestion {
    name: string,
    text: string,
}

export interface IEvaluationRadioListQuestion extends IEvaluationQuestion {
    kind: "radio-list",
    options: string[],
}

export interface IEvaluationTextareaQuestion extends IEvaluationQuestion {
    kind: "textarea",
    lines: number,
    placeholder?: string,
}

export interface IEvaluationSelectQuestion extends IEvaluationQuestion {
    kind: "select",
    options: string[],
}

export interface IEvaluationCheckboxListQuestion extends IEvaluationQuestion {
    kind: "checkbox-list",
    options: string[],
}

export interface IEvaluationTextQuestion extends IEvaluationQuestion {
    kind: "text",
    placeholder?: string,
}

const evaluationNameCodeMap = {
    "Layperson": "A",
    "IBD": "B",
    "CKD": "C",
} as const;

export function getEvaluationNames(): EvaluationName[] {
    return Object.keys(evaluationNameCodeMap) as EvaluationName[];
}

export function getEvaluationName(code: string): EvaluationName {
    code = code[0]
    return Object.keys(evaluationNameCodeMap).find((key) => evaluationNameCodeMap[key as EvaluationName] === code) as EvaluationName;
}

export function getEvaluationCode(name: EvaluationName): EvaluationCode {
    return evaluationNameCodeMap[name];
}

export function getEvaluation(code: string): IEvaluationData {
    code = code[0]
    return Evaluations[code as EvaluationCode];
}

export type EvaluationName = keyof typeof evaluationNameCodeMap;
export type EvaluationCode = typeof evaluationNameCodeMap[EvaluationName];

export const Evaluations: Record<EvaluationCode, IEvaluationData> = {
    "A": laypersonEvaluation as unknown as IEvaluationData,
    "B": ibdEvaluation as unknown as IEvaluationData,
    "C": ckdEvaluation as unknown as IEvaluationData,
}
