import { Canvas, DataTable, useQuery, useWorkspace, ISerializedWorkspace, TableSaveFile } from "@nephro-react/filters";
import { useEffect, useRef, useState } from "react";
import { Table } from "@nephro-react/filters-commons";
import evaluationJson from "../assets/data/presentation.json";
import { Button } from "./Button";

interface IEvaluation {
    sources: Record<string, TableSaveFile>;
    tasks: {
        query: string;
        source: string;
        hidden: undefined | boolean;
        targets: { name: string; ids: number[] }[];
    }[];
}

const data = evaluationJson as IEvaluation;
data.tasks = data.tasks.filter((task) => !task.hidden);

function App() {
    const { setQuerySource, queryResults, querySource, setTargets } = useQuery();
    const { load, save, clear } = useWorkspace();
    const [workspaceStates, setWorkspaceStates] = useState<Record<number, ISerializedWorkspace>>({});
    const [width, setWidth] = useState(document.documentElement.clientWidth - 600); // TODO: this is a hack
    const [height, setHeight] = useState(document.documentElement.clientHeight - 121); // TODO: this aswell

    const [currentTask, setCurrentTask] = useState(0);
    const [previousTask, setPreviousTask] = useState(0);
    const [currentTab, setCurrentTab] = useState(0);
    const [completedTasks, setCompletedTasks] = useState<number[]>([]);
    const [currentSource, setCurrentSource] = useState<DataTable>();
    const [currentTargets, setCurrentTargets] = useState<Record<string, string>>({});
    const [displayedTable, setDisplayedTable] = useState<DataTable>(DataTable.empty());
    const [highlighedRows, setHighlightedRows] = useState<number[] | undefined>(undefined);
    const [stats, setStats] = useState<Record<string, {precision: number, recall: number}>>({});

    const footerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        handleResize();
    }, []);

    function handleResize() {
        const headerHeight = headerRef.current?.clientHeight ?? 0;
        const footerHeight = footerRef.current?.clientHeight ?? 0;
        setHeight(document.documentElement.clientHeight - footerHeight - headerHeight);
        const sidebarWidth = sidebarRef.current?.clientWidth ?? 0;
        setWidth(document.documentElement.clientWidth - sidebarWidth);
    }

    useEffect(() => {
        const source = DataTable.fromJSON(data.sources[data.tasks[currentTask].source]);

        const targets: Record<string, string> = {};

        let i = 0;
        for (const target of data.tasks[currentTask].targets) {
            targets[`target${i}`] = target.name;
            i++;
        }

        setTargets(targets);

        setCurrentTargets(targets);
        setStats(Object.fromEntries(data.tasks[currentTask].targets.map((target) => [target.name, {precision: 1, recall: 0}])));
        setCurrentSource(source);
        setQuerySource(source);
        setCurrentTab(0);

        const state = save();
        setWorkspaceStates((prev) => {
            return {
                ...prev,
                [previousTask]: {...state},
            };
        });

        if(workspaceStates[currentTask]) {
            load(workspaceStates[currentTask]);
        } else {
            clear()
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTask]);

    useEffect(() => {
        if (currentTab === 0) {
            setDisplayedTable(currentSource ?? DataTable.empty());
            setHighlightedRows(undefined);
        } else {
            const target = data.tasks[currentTask].targets[currentTab - 1];
            const targetId = Object.keys(currentTargets).find((key) => currentTargets[key] === target.name);
            const table = queryResults[targetId!];
            if (table) {
                setDisplayedTable(table);
                const correctRows = currentSource?.getRows().map((row) => row[DataTable.indexColumnName_]).filter((id) => target.ids.includes(id)) ?? [];
                setHighlightedRows(correctRows);
            } else {
                setDisplayedTable(querySource.cloneStructure());
                setHighlightedRows(undefined);
            }
        }
    }, [currentSource, currentTab, currentTargets, currentTask, queryResults, querySource]);

    useEffect(() => {
        const newStats: Record<string, {precision: number, recall: number}> = {};
        for (const target of data.tasks[currentTask].targets) {
            const targetId = Object.keys(currentTargets).find((key) => currentTargets[key] === target.name);
            const table = queryResults[targetId!];
            if (table) {
                const correctRows = currentSource?.getRows().map((row) => row[DataTable.indexColumnName_]).filter((id) => target.ids.includes(id)) ?? [];
                const correct = table.getRows().filter((row) => correctRows.includes(row[DataTable.indexColumnName_])).length;
                const precision = (correct / table.getRows().length) || 1;
                const recall = correct / correctRows.length;
                newStats[target.name] = {precision, recall};
            } else {
                newStats[target.name] = {precision: 1, recall: 0};
            }
        }
        setStats(newStats);
    }, [currentSource, currentTargets, currentTask, queryResults]);

    return (
        <div className="flex flex-row">
            <div>
                <div
                    ref={headerRef}
                    className="bg-white w-full p-2 border-0 border-r border-gray-200 flex flex-row items-center justify-between h-11"
                >
                    <h1 className="text-xl text-gray-900">Presentation Demo</h1>
                    <div>
                        {data.tasks.map((_, index) => {
                            return (
                                <button
                                    className={`${
                                        currentTask === index
                                            ? "bg-primary-500 text-white"
                                            : completedTasks.includes(index)
                                            ? "bg-primary-500/20 text-primary-500"
                                            : "text-primary-500 bg-white"
                                    } p-1 h-6 w-6 leading-3 rounded-full ml-1 border border-primary-500`}
                                    key={index}
                                    onClick={() => {
                                        setPreviousTask(currentTask);
                                        setCurrentTask(index);
                                    }}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex flex-row">
                    <Canvas width={width} height={height} language={"de"} />
                </div>
                <div ref={footerRef} className="bg-white w-full p-2 border-0 border-r border-t border-gray-200 h-20">
                    <div className="text-gray-900">
                        <b className="font-semibold">Challenge:</b> {data.tasks[currentTask].query}
                    </div>
                </div>
            </div>
            <div className="max-w-[600px] w-full h-full flex flex-col" ref={sidebarRef}>
                <div ref={headerRef} className="bg-white w-full h-11">
                    <div className="text-gray-900 flex flex-row gap-1 relative h-full">
                        {["Source", ...data.tasks[currentTask].targets.map((target) => target.name)].map(
                            (name, index) => {
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
                            }
                        )}
                    </div>
                </div>
                <div className="border-0 border-t border-gray-200 overflow-auto" style={{height: height}}>
                    <Table showIndex={true} dataTable={displayedTable} page={0} rowsPerPage={100000} highlightedRows={highlighedRows} />
                </div>
                <div
                    ref={footerRef}
                    className="bg-white w-[600px] p-2 border-0 border-t border-gray-200 h-20 absolute bottom-[-1px] flex flex-row items-start justify-between"
                >
                    {Object.entries(stats).map(([name, {precision, recall}]) => {
                        return (
                            <div key={name}>
                                <b className="font-semibold">{name}</b>: Precision {(precision*100).toFixed(0)}%, Recall {(recall*100).toFixed(0)}%
                            </div>
                        );
                    })}
                    <Button disabled={Object.values(stats).some(({precision, recall}) => precision < 0.95 || recall < 0.95)} onClick={() => {
                        setCompletedTasks([...completedTasks, currentTask]);
                        setPreviousTask(currentTask);
                        if(currentTask < data.tasks.length - 1){
                            setCurrentTask(currentTask + 1);
                        } else {
                            setCurrentTask(0);
                        }
                    }}>Submit</Button>
                </div>
            </div>
        </div>
    );
}

export default App;
