import { Button, useLocalStorage } from "@v-ice/commons";
import { useState } from "react";
import { Code } from "../Code";
import { Panel, PanelResizeHandle } from "react-resizable-panels";

interface SavedCode {
    name: string;
    code: string;
}

export function CodePanel({
    title,
    storageKey,
    defaultCode,
}: {
    title: string;
    storageKey: string;
    defaultCode: string;
}) {
    const [savedList, setSavedList] = useLocalStorage<SavedCode[]>(storageKey, []);
    const [current, setCurrent] = useState<SavedCode>({ name: "", code: defaultCode });

    const selectedSaved = savedList.find((s) => s.name === current.name);
    const isDirty = selectedSaved ? selectedSaved.code !== current.code : current.code !== defaultCode;

    function save() {
        if (current.name === "") return;
        const exists = savedList.some((s) => s.name === current.name);
        let newList: SavedCode[];
        if (exists) {
            newList = savedList.map((s) => (s.name === current.name ? { ...s, code: current.code } : s));
        } else {
            newList = [...savedList, { ...current }];
        }
        setSavedList(newList);
    }

    return (
        <>
            <Panel defaultSize={20}>
                <div className="flex flex-col h-full p-1">
                    <h2 className="text-xs font-semibold">{title}</h2>
                    {savedList.map((s) => (
                        <div
                            key={s.name}
                            className={`p-1 text-xs flex flex-row justify-between group cursor-pointer hover:bg-gray-100 ${s.name === current.name ? "bg-gray-200 hover:bg-gray-300" : ""}`}
                            onClick={() => setCurrent(s)}
                        >
                            <div>{s.name}</div>
                            <div
                                className="text-red-500 text-xs hidden group-hover:block"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSavedList(savedList.filter((item) => item.name !== s.name));
                                    if (s.name === current.name) {
                                        setCurrent({ name: "", code: defaultCode });
                                    }
                                }}
                            >
                                Delete
                            </div>
                        </div>
                    ))}
                </div>
            </Panel>
            <PanelResizeHandle className="border-l" />
            <Panel defaultSize={80}>
                <div className="flex flex-col h-full">
                    <div className="text-xs flex flex-row gap-1 p-1 border-b items-center justify-between">
                        <div>
                            <input
                                type="text"
                                className="border border-gray-300 rounded-sm p-1"
                                value={current.name}
                                onChange={(e) => setCurrent({ ...current, name: e.target.value })}
                                placeholder="Enter name for the code"
                            />
                            {isDirty && " (unsaved changes)"}
                        </div>
                        <Button
                            className="bg-blue-500 hover:bg-blue-600"
                            disabled={current.name === ""}
                            onClick={save}
                        >
                            Save
                        </Button>
                    </div>
                    <Code
                        code={current.code}
                        onChange={(v) => setCurrent({ ...current, code: v })}
                        language="typescript"
                    />
                </div>
            </Panel>
        </>
    );
}
