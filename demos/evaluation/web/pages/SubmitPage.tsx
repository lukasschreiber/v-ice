import { useEffect, useState } from "react";
import { useEvaluationState } from "../store/useEvaluationHook";
import { submitEvaluation } from "../utils/api";

enum SubmitStatus {
    NO_CODE,
    NO_CONSENT,
    ERROR,
    SUCCESS,
}

export function SubmitPage() {
    const [status, setStatus] = useState<SubmitStatus | null>(null);
    const { evaluation } = useEvaluationState();

    useEffect(() => {
        if (!evaluation.user?.code) {
            setStatus(SubmitStatus.NO_CODE);
            return;
        }
        if (!evaluation.user?.consentGiven) {
            setStatus(SubmitStatus.NO_CONSENT);
            return;
        }

        // submit evaluation
        submitEvaluation(evaluation)
            .then(() => {
                setStatus(SubmitStatus.SUCCESS);
            })
            .catch(() => {
                setStatus(SubmitStatus.ERROR);
            });
    }, [evaluation.user?.code, evaluation.user?.consentGiven, evaluation]);

    return (
        <div className="flex items-center flex-col gap-4 justify-center w-screen h-screen">
            <h1 className="text-4xl font-semibold">Vielen Dank für Ihre Teilnahme!</h1>
            {status === SubmitStatus.NO_CODE && <p className="text-xl">Es wurde kein Code gefunden.</p>}
            {status === SubmitStatus.NO_CONSENT && <p className="text-xl">Es wurde keine Einwilligung gefunden.</p>}
            {status === SubmitStatus.ERROR && <p className="text-xl">Es ist ein Fehler aufgetreten.</p>}
            {status === SubmitStatus.SUCCESS && (
                <>
                    <p className="text-xl">Wir haben Ihre Antworten erhalten und werden diese nun auswerten.</p>
                    <p className="text-xl font-semibold">Sie können das Fenster nun schließen.</p>
                </>
            )}
        </div>
    );
}
