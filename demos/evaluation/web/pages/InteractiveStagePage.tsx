import { Canvas, DataTable, Evaluation, useQuery, useWorkspace } from "@nephro-react/filters";
import { useEffect, useRef, useState } from "react";
import { Table } from "@nephro-react/filters-commons";
import { IEvaluationData, IEvaluationInteractiveStage } from "../../assets/data/evaluations";
import { Button } from "../common/Button";
import { useEvaluationState } from "../store/useEvaluationHook";
import {
    EvaluationAction,
    EvaluationActionEvent,
    EvaluationActionPayloads,
} from "@nephro-react/filters/dist/evaluation_emitter";

export function InteractiveStagePage(props: {
    stageDefinition: IEvaluationInteractiveStage;
    data: IEvaluationData;
    taskId: number;
    stageKey: string;
}) {
    const { setQuerySource, queryResults, querySource, setTargets } = useQuery();
    const { clear, save } = useWorkspace();
    const [width, setWidth] = useState(document.documentElement.clientWidth - 600); // TODO: this is a hack
    const [height, setHeight] = useState(document.documentElement.clientHeight - 230); // TODO: this aswell EDIT: I think it works now and ignores the initial value, don't know why

    const startTimeRef = useRef<number>(0);
    const eventLogRef = useRef<
        { name: EvaluationAction; time: number; payload: EvaluationActionPayloads[EvaluationAction] }[]
    >([]);

    const [currentTab, setCurrentTab] = useState(0);
    const [currentSource, setCurrentSource] = useState<DataTable>();
    const [currentTargets, setCurrentTargets] = useState<Record<string, string>>({});
    const [displayedTable, setDisplayedTable] = useState<DataTable>(DataTable.empty());

    const [introductionScreenVisible, setIntroductionScreenVisible] = useState(true);
    const [resultsScreenVisible, setResultsScreenVisible] = useState(false);

    const { evaluation, setEvaluationProperty } = useEvaluationState();

    const sidebarRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        handleResize();

        function handleEvaluationActionOccured({ action, payload }: EvaluationActionEvent) {
            const timestamp = Date.now();
            const relativeTimestamp = timestamp - startTimeRef.current;
            eventLogRef.current.push({ name: action, time: relativeTimestamp, payload });
        }

        Evaluation.events.on("evaluationActionOccured", handleEvaluationActionOccured);

        return () => {
            window.removeEventListener("resize", handleResize);
            Evaluation.events.off("evaluationActionOccured", handleEvaluationActionOccured);
        };
    }, []);

    function handleResize() {
        const headerHeight = headerRef.current?.clientHeight ?? 0;
        const topOffset = headerRef.current?.getBoundingClientRect().top ?? 0;
        setHeight(document.documentElement.clientHeight - headerHeight - topOffset);
        const sidebarWidth = sidebarRef.current?.clientWidth ?? 0;
        setWidth(document.documentElement.clientWidth - sidebarWidth);
    }

    useEffect(() => {
        const source = DataTable.fromJSON(props.data.sources[props.stageDefinition.tasks[props.taskId].source]);

        const targets: Record<string, string> = {};

        let i = 0;
        for (const target of props.stageDefinition.tasks[props.taskId].targets) {
            targets[`target${i}`] = target.name;
            i++;
        }

        setTargets(targets);

        setCurrentTargets(targets);

        setCurrentSource(source);
        setQuerySource(source);
        setCurrentTab(0);
        setIntroductionScreenVisible(true);
        setResultsScreenVisible(false);

        clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.taskId]);

    useEffect(() => {
        if (currentTab === 0) {
            setDisplayedTable(currentSource ?? DataTable.empty());
        } else {
            const target = props.stageDefinition.tasks[props.taskId].targets[currentTab - 1];
            const targetId = Object.keys(currentTargets).find((key) => currentTargets[key] === target.name);
            if (!targetId) {
                setDisplayedTable(querySource.cloneStructure());
            } else {
                const table = queryResults[targetId];
                if (table) {
                    setDisplayedTable(table);
                } else {
                    setDisplayedTable(querySource.cloneStructure());
                }
            }
        }
    }, [currentSource, currentTab, currentTargets, props.taskId, queryResults, querySource]);

    function submitTask() {
        const endTime = Date.now();
        const duration = endTime - startTimeRef.current;
        const stats: { precision: number; recall: number }[] = [];
        for (const target of props.stageDefinition.tasks[props.taskId].targets) {
            const targetId = Object.keys(currentTargets).find((key) => currentTargets[key] === target.name);
            if (!targetId) {
                continue;
            }
            const table = queryResults[targetId];
            if (table) {
                const correctRows =
                    currentSource
                        ?.getRows()
                        .map((row) => row[DataTable.indexColumnName_])
                        .filter((id) => target.ids.includes(id)) ?? [];
                const correct = table
                    .getRows()
                    .filter((row) => correctRows.includes(row[DataTable.indexColumnName_])).length;
                const precision = correct / table.getRows().length || 1;
                const recall = correct / correctRows.length;
                stats.push({ precision, recall });
            } else {
                stats.push({ precision: 1, recall: 0 });
            }
        }

        // calculate average stats
        const accumulatedStats = stats.reduce(
            (acc, current) => {
                acc.precision += current.precision;
                acc.recall += current.recall;
                return acc;
            },
            { precision: 0, recall: 0 }
        );

        const newStats = {
            precision: accumulatedStats.precision / stats.length,
            recall: accumulatedStats.recall / stats.length,
        };

        const chosenEntities: Record<string, number[]> = {};
        for (const target of props.stageDefinition.tasks[props.taskId].targets) {
            const targetId = Object.keys(currentTargets).find((key) => currentTargets[key] === target.name);
            if (!targetId) {
                continue;
            }
            const table = queryResults[targetId];
            if (table) {
                chosenEntities[target.name] = table.getRows().map((row) => row[DataTable.indexColumnName_]);
            } else {
                chosenEntities[target.name] = [];
            }
        }

        setEvaluationProperty(`tasks.${props.stageKey}.${props.taskId}`, {
            isPractice: props.stageDefinition.learning ?? false,
            recall: newStats.recall,
            precision: newStats.precision,
            time: duration,
            chosenEntities: chosenEntities,
            events: eventLogRef.current,
            resultWorkspace: save(),
        });
        setResultsScreenVisible(true);
    }

    return (
        <>
            {introductionScreenVisible && (
                <div className="flex flex-col p-2 items-center w-full absolute justify-center h-full z-[100000] bg-white">
                    <div className="flex flex-col gap-4 max-w-[600px]">
                        {props.stageDefinition.learning && (
                            <div className="overflow-hidden rounded-md shadow-md">
                                <div className="bg-primary-400 font-semibold text-white px-2 py-0.5 flex flex-row gap-1">
                                    Hinweis
                                </div>
                                <div className="bg-primary-100 px-2 py-0.5">
                                    Die folgende Aufgabenstellung dient dem Vertrautwerden mit dem Programm. Während
                                    dieser Aufgabe wird die Bearbeitungszeit nicht gemessen.
                                </div>
                            </div>
                        )}
                        <div className="text-gray-900 text-xl">
                            <b className="font-semibold">Aufgabenstellung:</b>{" "}
                            {props.stageDefinition.tasks[props.taskId].query}
                        </div>
                        <div className="text-gray-900">
                            Bitte lesen Sie sich die Aufgabenstellung durch und klicken Sie auf{" "}
                            <b className="font-semibold">"Bearbeiten"</b>, wenn sie bereit sind.{" "}
                            {props.stageDefinition.learning
                                ? "Die Bearbeitungszeit würde bei einer richtigen Aufgabe ab diesem Zeitpunkt gemessen werden."
                                : "Die Bearbeitungszeit wird ab diesem Zeitpunkt gemessen."}
                            <br />
                            Bearbeiten Sie die Aufgabe. Während der Bearbeitung ist die Aufgabenstellung weiterhin oben
                            links sichtbar. Um händisch zu prüfen, ob Ihre Lösung korrekt ist, können Sie die Tabellen
                            auf der rechten Seite verwenden. Die Tabelle "Quelle" zeigt die Eingabedaten an, die
                            Tabellen mit dem Name "Gruppe X" oder "Target" zeigen das jeweilige von Ihnen ausgewählte
                            Ergebnis an.
                            <br />
                            Wenn Sie mit Ihrer Lösung zufrieden sind, klicken Sie auf{" "}
                            <b className="font-semibold">"Abschließen"</b>, um das Ergebnis zu sehen.
                            <br />
                            <br />
                            {props.stageDefinition.learning && (
                                <div>
                                    <b className="font-semibold">Hinweis:</b> Um sich mit dem Programm vertraut zu
                                    machen, können Sie das Handbuch öffnen, in dem Sie auf das Buch-Symbol unten links
                                    klicken oder einen beliebigen Block rechts-klicken und im Menü den Punkt "Hilfe"
                                    auswählen.
                                </div>
                            )}
                            <Button
                                className="mt-2 !p-2 !px-5 font-semibold"
                                onClick={() => {
                                    setIntroductionScreenVisible(false);
                                    startTimeRef.current = Date.now();
                                    eventLogRef.current = [];
                                }}
                            >
                                Bearbeiten
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {resultsScreenVisible && evaluation.tasks?.[props.stageKey]?.[props.taskId] && (
                <div className="flex flex-col p-2 pt-4 items-center w-full absolute h-full z-[100000] bg-white gap-2 overflow-auto">
                    <h1 className="font-semibold text-3xl">Ihr Ergebnis 🎉</h1>
                    <table>
                        <tbody>
                            <tr className="border-b border-solid">
                                <td className="font-semibold pr-2">Genauigkeitsquote (Precision):</td>
                                <td className="text-right">
                                    {(evaluation.tasks[props.stageKey][props.taskId].precision * 100).toFixed(2)}%
                                </td>
                            </tr>
                            <tr className="border-b border-solid">
                                <td className="font-semibold pr-2">Vollständigkeitsquote (Recall):</td>
                                <td className="text-right">
                                    {(evaluation.tasks[props.stageKey][props.taskId].recall * 100).toFixed(2)}%
                                </td>
                            </tr>
                            {!evaluation.tasks[props.stageKey][props.taskId].isPractice && (
                                <tr className="border-b border-solid">
                                    <td className="font-semibold pr-2">Bearbeitungszeit:</td>
                                    <td className="text-right">
                                        {(evaluation.tasks[props.stageKey][props.taskId].time / 1000).toFixed(0)}{" "}
                                        Sekunden
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {props.stageDefinition.tasks[props.taskId].solutionLink && (
                        <div className="w-fit flex flex-col items-center mt-12">
                            <h1 className="font-semibold text-3xl">Musterlösung</h1>
                            <p>Eine mögliche Lösung könnte so aussehen:</p>
                            <img
                                src={props.stageDefinition.tasks[props.taskId].solutionLink}
                                alt="solution"
                                className="max-w-[80%] w-[1000px]"
                            />
                        </div>
                    )}
                </div>
            )}
            <div
                className={`flex flex-row grow ${introductionScreenVisible || resultsScreenVisible ? "invisible" : ""}`}
            >
                <div>
                    <div
                        ref={headerRef}
                        className="bg-white w-full p-2 border-0 border-r border-gray-200 flex flex-row items-center justify-between h-18"
                    >
                        <div className="text-gray-900">
                            <b className="font-semibold">Aufgabenstellung:</b>{" "}
                            {props.stageDefinition.tasks[props.taskId].query}
                        </div>
                        <Button
                            className="!p-2 !px-5 font-semibold"
                            onClick={() => {
                                submitTask();
                            }}
                        >
                            Abschließen
                        </Button>
                    </div>
                    <div className="flex flex-row">
                        <Canvas
                            width={width}
                            height={height}
                            language={props.data.survey.meta.language}
                            helpUrl="/help"
                        />
                    </div>
                </div>
                <div className="max-w-[600px] w-full h-full flex flex-col" ref={sidebarRef}>
                    <div className="bg-white w-full h-14">
                        <div className="text-gray-900 flex flex-row gap-1 relative h-full">
                            {[
                                "Source",
                                ...props.stageDefinition.tasks[props.taskId].targets.map((target) => target.name),
                            ].map((name, index) => {
                                return (
                                    <button
                                        className={`${
                                            currentTab === index
                                                ? "border-primary-500 bg-primary-500/10"
                                                : "border-white"
                                        } border-0 border-b-4 p-1 text-gray-900 h-full`}
                                        key={index}
                                        onClick={() => {
                                            setCurrentTab(index);
                                        }}
                                    >
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div
                        className="border-0 border-t border-gray-200 overflow-auto h-full flex"
                        style={{ height: height }}
                    >
                        <Table showIndex={true} dataTable={displayedTable} page={0} rowsPerPage={100000} className="" />
                    </div>
                </div>
            </div>
        </>
    );
}
