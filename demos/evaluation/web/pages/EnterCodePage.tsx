import { useEffect, useState } from "react";
import { Button } from "../common/Button";
import { useEvaluationState } from "../store/useEvaluationHook";
import { Input } from "../common/Input";
import { Link, useNavigate } from "react-router-dom";
import { Evaluations, getEvaluation } from "../../assets/data/evaluations";
import { verifyCode } from "../utils/api";

const codeRegexString = `^[${Object.keys(Evaluations).join(",")}]-\\d{5}$`;
const codeRegex = new RegExp(codeRegexString);

enum CodeError {
    FORMAT,
    NOT_FOUND,
}

export function EnterCodePage() {
    const [screenIsTooSmall, setScreenIsTooSmall] = useState(false);
    const [code, setCode] = useState("");
    const navigate = useNavigate();
    const [codeError, setCodeError] = useState<CodeError | null>(null);
    const { setEvaluationProperty } = useEvaluationState();

    useEffect(() => {
        const onResize = () => {
            setScreenIsTooSmall(window.innerWidth < 1024 || window.innerHeight < 768);
            setEvaluationProperty("user.browser.screenMetrics.width", window.innerWidth);
            setEvaluationProperty("user.browser.screenMetrics.height", window.innerHeight);
        };

        window.addEventListener("resize", onResize);
        onResize();

        return () => {
            window.removeEventListener("resize", onResize);
        };
    }, []);

    return (
        <div className="bg-gray-100 absolute top-0 bottom-0 left-0 right-0">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg p-4 rounded-md bg-white text-gray-900 max-w-[500px] flex flex-col items-center gap-2">
                <h1 className="text-xl font-semibold">Evaluation</h1>
                <h2 className="text-md font-semibold text-gray-700">
                    Entwicklung und Evaluation eines visuellen Code-Editors zur interaktiven Kohorten-Erstellung
                </h2>

                <Input
                    type="text"
                    placeholder="X-12345"
                    className={`w-full ${
                        codeError === null && code === "" ? "" : codeError !== null ? "bg-red-100" : "bg-green-100"
                    } rounded-md px-1.5 py-0.5`}
                    value={code}
                    onChange={(e) => {
                        const value = e.target.value;
                        const formatCorrect = codeRegex.test(value);
                        setCode(e.target.value);

                        if (!formatCorrect) {
                            setCodeError(CodeError.FORMAT);
                            return;
                        }
                        verifyCode(value).then((evaluation) => {
                            setCodeError(evaluation === null ? CodeError.NOT_FOUND : null);
                        })
                    }}
                />
                <Button
                    className="w-full text-md"
                    disabled={screenIsTooSmall || codeError !== null}
                    onClick={() => {
                        const stages = getEvaluation(code).survey.stages;
                        const firstStage = Object.keys(stages)[0];
                        if (stages[firstStage].kind === "interactive") {
                            navigate(`/evaluation/${firstStage}/0?code=${code}&force=true`);
                        } else {
                            navigate(`/evaluation/${firstStage}?code=${code}&force=true`);
                        }
                    }}
                >
                    Start
                </Button>
                {screenIsTooSmall && (
                    <p className="text-sm text-red-500">
                        Das Fenster ist zu klein um an der Evaluation teilzunehmen. Das Fenster muss mindestens 768 x
                        1024px groß sein.
                    </p>
                )}
                {codeError !== null && code !== "" && (
                    <p className="text-sm text-red-500">
                        {codeError === CodeError.FORMAT ? "Der Code entspricht nicht dem erwarteten Format. Bitte überprüfen Sie den Code und versuchen Sie es erneut." : "Der Code konnte nicht gefunden werden. Bitte überprüfen Sie den Code und versuchen Sie es erneut."}
                    </p>
                )}
                <Link to={"/"} className="text-sm text-gray-600 underline">
                    Zurück
                </Link>
            </div>
        </div>
    );
}
