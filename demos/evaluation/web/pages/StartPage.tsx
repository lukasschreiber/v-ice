import { useEffect, useState } from "react";
import { useEvaluationState } from "../store/useEvaluationHook";
import { useNavigate } from "react-router-dom";
import { Button } from "../common/Button";
import { getEvaluation } from "../../assets/data/evaluations";
import { generateCode } from "../utils/api";

export function StartPage() {
    const { setEvaluationProperty, evaluation } = useEvaluationState();
    const [screenIsTooSmall, setScreenIsTooSmall] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // collect infos on user agent and screen size
        const userAgent = navigator.userAgent;
        const isBrave = navigator["brave" as keyof typeof navigator] !== undefined;
        const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

        setEvaluationProperty("user.browser.userAgent", userAgent);
        setEvaluationProperty("user.browser.isBrave", isBrave);
        setEvaluationProperty("user.browser.prefersDarkMode", prefersDarkMode);

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
                <p className="text-sm text-gray-600">
                    Ziel der Bachelorarbeit ist es, Ärzten und Ärztinnen eine einfache Lösung zu geben, selbstständig
                    Kohorten zu erstellen. Die Anwendung einer visuellen Programmiersprache kann mögliche
                    Kommunikationslücken zwischen Mediziner*innen und Analyst*innen schließen, wenn Kohorten direkt
                    selbst definiert werden können.
                    <br />
                    <br />
                    Diese Studie soll die Nutzbarkeit der visuellen Programmiersprache
                    überprüfen und Einblicke in die Art und Weise geben, wie Nutzer die visuelle Programmiersprache
                    verwenden. Die Ergebnisse der Studie können dazu verwendet werden, die visuelle Programmiersprache
                    zu evaluieren.
                </p>
                <Button
                    className="w-full text-md"
                    disabled={screenIsTooSmall}
                    onClick={async () => {
                        const code = evaluation.user?.code || (await generateCode("Layperson"));
                        const stages = getEvaluation(code).survey.stages;
                        const firstStage = Object.keys(stages)[0];
                        if (stages[firstStage].kind === "interactive") {
                            navigate(`/evaluation/${firstStage}/0?code=${code}`);
                        } else {
                            navigate(`/evaluation/${firstStage}?code=${code}`);
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
                {/* <Link to={"enter"} className="text-sm text-gray-600 underline">
                    Mit personalisiertem Code teilnehmen.
                </Link> */}
            </div>
        </div>
    );
}
