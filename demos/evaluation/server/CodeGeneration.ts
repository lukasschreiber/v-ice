import { EvaluationName, getEvaluationCode } from '../assets/data/evaluations.js';

export function generateCode(evaluation: EvaluationName = "Layperson") {
    const evaluationCode = getEvaluationCode(evaluation);
    return `${evaluationCode}-${generate5DigitCode()}`;
}

function generate5DigitCode() {
    return Math.floor(10000 + Math.random() * 90000);
}
