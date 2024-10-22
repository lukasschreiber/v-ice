import { IEvaluation, IEvaluationTaskResult } from "../../evaluation/web/store/EvaluationContext";
import { msToTime } from "./utils";

export function InfoTable(
    props: React.HTMLProps<HTMLTableElement> & {
        solution?: IEvaluationTaskResult | undefined;
        evaluation?: IEvaluation | undefined;
    }
) {
    const { solution, evaluation, className, ...rest } = props;
    return (
        <table className={`${className} border border-gray-600 text-xs`} {...rest}>
            <thead>
                <tr>
                    {solution && (
                        <>
                            <th className="border border-gray-600 px-1">Time</th>
                            <th className={`border border-gray-600 px-1 ${solution.recall == 1 && solution.precision == 1 ? "bg-green-300" : "bg-red-300"}`}>Recall</th>
                            <th className={`border border-gray-600 px-1 ${solution.recall == 1 && solution.precision == 1 ? "bg-green-300" : "bg-red-300"}`}>Precision</th>
                            <th className="border border-gray-600 px-1">IsLearning</th>
                        </>
                    )}
                    {evaluation && (
                        <>
                            <th className="border border-gray-600 px-1">ComputerExperience</th>
                            <th className="border border-gray-600 px-1">ProgrammingLanguages</th>
                            <th className="border border-gray-600 px-1">VisualProgrammingLanguages</th>
                            <th className="border border-gray-600 px-1">Age</th>
                            <th className="border border-gray-600 px-1">Gender</th>
                            <th className="border border-gray-600 px-1">HighestEducationalQualification</th>
                            <th className="border border-gray-600 px-1">FieldOfStudy</th>
                            <th className="border border-gray-600 px-1">TimeSpent</th>
                            <th className="border border-gray-600 px-1">TasksSolved</th>
                            <th className="border border-gray-600 px-1">AvgTimeLearning</th>
                            <th className="border border-gray-600 px-1">AvgTimeEvaluation</th>
                            <th className="border border-gray-600 px-1">AvgTime</th>
                        </>
                    )}
                </tr>
            </thead>
            <tbody>
                <tr>
                    {solution && (
                        <>
                            <td className="border border-gray-600 px-1">{msToTime(solution.time)}</td>
                            <td className={`border border-gray-600 px-1 ${solution.recall == 1 && solution.precision == 1 ? "bg-green-300" : "bg-red-300"}`}>{solution.recall.toFixed(2)}</td>
                            <td className={`border border-gray-600 px-1 ${solution.recall == 1 && solution.precision == 1 ? "bg-green-300" : "bg-red-300"}`}>{solution.precision.toFixed(2)}</td>
                            <td className="border border-gray-600 px-1">{solution.isPractice ? "Yes" : "No"}</td>
                        </>
                    )}
                    {evaluation && (
                        <>
                            <td className="border border-gray-600 px-1">
                                {evaluation.results["computer-experience"]["ComputerExperience"].answer}
                            </td>
                            <td className="border border-gray-600 px-1">
                                {(
                                    evaluation.results["computer-experience"]["ProgrammingExperience"]
                                        .answer as string[]
                                ).join(", ")}
                            </td>
                            <td className="border border-gray-600 px-1">
                                {(
                                    evaluation.results["computer-experience"]["VisualLanguageExperience"]
                                        .answer as string[]
                                ).join(", ")}
                            </td>
                            <td className="border border-gray-600 px-1">
                                {evaluation.results["demographics"]["Age"]?.answer}
                            </td>
                            <td className="border border-gray-600 px-1">
                                {evaluation.results["demographics"]["Gender"]?.answer}
                            </td>
                            <td className="border border-gray-600 px-1">
                                {evaluation.results["demographics"]["HighestEducationalQualification"]?.answer}
                            </td>
                            <td className="border border-gray-600 px-1">
                                {evaluation.results["demographics"]["FieldOfStudy"]?.answer}
                            </td>
                            <td className="border border-gray-600 px-1">
                                {msToTime(Object.values(evaluation.tasks).flatMap(task => Object.values(task).flatMap(task => task.time)).reduce((a, b) => a + b, 0))}
                            </td>
                            <td className="border border-gray-600 px-1">
                                {Object.values(evaluation.tasks).flatMap(task => Object.values(task).flatMap(task => task.time)).filter(time => time > 10000).length / Object.values(evaluation.tasks).flatMap(task => Object.values(task).flatMap(task => task.time)).length * 100} %
                            </td>
                            <td className="border border-gray-600 px-1">
                                {msToTime(Object.values(evaluation.tasks).flatMap(task => Object.values(task).filter(task => task.isPractice).flatMap(task => task.time)).reduce((a, b) => a + b, 0) / Object.values(evaluation.tasks).flatMap(task => Object.values(task).filter(task => task.isPractice)).length)}
                            </td>
                            <td className="border border-gray-600 px-1">
                                {msToTime(Object.values(evaluation.tasks).flatMap(task => Object.values(task).filter(task => !task.isPractice).flatMap(task => task.time)).reduce((a, b) => a + b, 0) / Object.values(evaluation.tasks).flatMap(task => Object.values(task).filter(task => !task.isPractice)).length)}
                            </td>
                            <td className="border border-gray-600 px-1">
                                {msToTime(Object.values(evaluation.tasks).flatMap(task => Object.values(task).flatMap(task => task.time)).reduce((a, b) => a + b, 0) / Object.values(evaluation.tasks).flatMap(task => Object.values(task).flatMap(task => task.time)).length)}
                            </td>
                        </>
                    )}
                </tr>
            </tbody>
        </table>
    );
}
