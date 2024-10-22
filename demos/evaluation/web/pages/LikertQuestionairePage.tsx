import { useEffect, useRef, useState } from "react";
import { IEvaluationQuestionaireLikertStage } from "../../assets/data/evaluations";
import { useEvaluationState } from "../store/useEvaluationHook";

export function LikertQuestionairePage(props: { stage: IEvaluationQuestionaireLikertStage; stageKey: string }) {
    const { setEvaluationProperty, evaluation } = useEvaluationState();
    const tableCellRef = useRef<HTMLTableCellElement>(null);
    const [tableCellWidth, setTableCellWidth] = useState(0);

    useEffect(() => {
        function handleResize() {
            setTableCellWidth(tableCellRef.current?.getBoundingClientRect().width ?? 0);
        }

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div className="overflow-auto flex flex-col h-full p-4 gap-4 bg-gray-100 items-center">
            <div className="p-6 shadow-sm bg-white rounded-md max-w-[80%] w-full relative">
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th colSpan={5} className="relative h-14">
                                <span
                                    className="font-normal text-xs absolute w-20 block px-3 -translate-x-1/2 top-0"
                                    style={{ left: `${tableCellWidth * 0.5}px` }}
                                >
                                    stimme überhaupt nicht zu
                                </span>
                                <span
                                    className="font-normal text-xs absolute w-20 block px-3 translate-x-1/2 top-0"
                                    style={{ right: `${tableCellWidth * 0.5}px` }}
                                >
                                    stimme voll und ganz zu
                                </span>
                            </th>
                        </tr>
                        <tr>
                            <th></th>
                            <th colSpan={5}>
                                <svg className="h-5 w-full">
                                    <line
                                        x1={`${tableCellWidth * 0.5}px`}
                                        y1="1px"
                                        x2={`${tableCellWidth * 4.5}px`}
                                        y2="1px"
                                        stroke="black"
                                        strokeWidth="1"
                                    />
                                    <line
                                        x1={`${tableCellWidth * 0.5}px`}
                                        y1="1px"
                                        x2={`${tableCellWidth * 0.5}px`}
                                        y2="16px"
                                        stroke="black"
                                        strokeWidth="1"
                                    />
                                    <line
                                        x1={`${tableCellWidth * 1.5}px`}
                                        y1="1px"
                                        x2={`${tableCellWidth * 1.5}px`}
                                        y2="16px"
                                        stroke="black"
                                        strokeWidth="1"
                                    />
                                    <line
                                        x1={`${tableCellWidth * 2.5}px`}
                                        y1="1px"
                                        x2={`${tableCellWidth * 2.5}px`}
                                        y2="16px"
                                        stroke="black"
                                        strokeWidth="1"
                                    />
                                    <line
                                        x1={`${tableCellWidth * 3.5}px`}
                                        y1="1px"
                                        x2={`${tableCellWidth * 3.5}px`}
                                        y2="16px"
                                        stroke="black"
                                        strokeWidth="1"
                                    />
                                    <line
                                        x1={`${tableCellWidth * 4.5}px`}
                                        y1="1px"
                                        x2={`${tableCellWidth * 4.5}px`}
                                        y2="16px"
                                        stroke="black"
                                        strokeWidth="1"
                                    />
                                </svg>
                            </th>
                        </tr>
                        <tr>
                            <th></th>
                            <th ref={tableCellRef} className="px-3 font-normal text-sm">
                                1
                            </th>
                            <th className="px-3 font-normal text-sm">2</th>
                            <th className="px-3 font-normal text-sm">3</th>
                            <th className="px-3 font-normal text-sm">4</th>
                            <th className="px-3 font-normal text-sm">5</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.stage.questions.map((question, index) => {
                            return (
                                <tr key={index} className="border-b">
                                    <td className="py-2 pr-5">{question.text}</td>
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <td key={value} className="text-center">
                                            <input
                                                type="radio"
                                                name={question.name}
                                                value={value}
                                                checked={
                                                    parseInt(
                                                        (evaluation.results?.[props.stageKey]?.[question.name]?.answer as string | undefined) ?? "0"
                                                    ) === value
                                                }
                                                onChange={(e) => setEvaluationProperty(`results.${props.stageKey}.${question.name}.answer`, e.target.value)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
