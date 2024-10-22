import { EvaluationName } from "../../assets/data/evaluations";
import { IEvaluation } from "../store/EvaluationContext";

const API = import.meta.env.VITE_API_BASE_URL;

export function generateCode(evaluation: EvaluationName): Promise<string> {
    return fetch(`${API}/code/gen?evaluation=${evaluation}`)
        .then(res => res.json())
        .then(({ code }) => code);
}

export function verifyCode(code: string): Promise<EvaluationName | null> {
    return fetch(`${API}/code/validate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
    })
        .then(res => {
            if (res.status === 404) {
                return null;
            }
            return res.json().then(({ evaluation }) => evaluation);
        })
        .catch(error => {
            // Handle any network errors or exceptions
            console.error('Error during fetch:', error);
            return null; // Resolve to null on error
        });
}

export function submitEvaluation(data: Partial<IEvaluation>): Promise<number> {
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    formData.append('results', blob, 'evaluation.json');

    return fetch(`${API}/result/submit`, {
        method: "POST",
        body: formData
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.error); });
        }
        return res.json();
    })
    .then(({ version }) => version);
}