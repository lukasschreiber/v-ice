import { useContext, useRef, useState } from "react";
import { useWorkspace, WorkspacePreview } from "v-ice";
import { Button } from "v-ice-commons";
import { Accordion } from "../Accordion";
import { StoreWorkspaceContext } from "../StoreWorkspaceContext";

export function WorkspaceSavePanel() {
    const { workspace, load, save } = useWorkspace();
    const [workspaceNames, setWorkspaceNames] = useState<Record<number, string>>({});
    const currentWorkspaceWrapperRef = useRef<HTMLDivElement>(null);
    const { savedWorkspaces, setSavedWorkspaces } = useContext(StoreWorkspaceContext);

    return (
        <div className="text-xs p-1">
            <Accordion title="Current Workspace" defaultOpen={true}>
                <div className="flex flex-col gap-2" ref={currentWorkspaceWrapperRef}>
                    <div className="flex flex-row gap-1 items-center relative mt-2">
                        <input
                            type="text"
                            className="text-xs border border-gray-200 p-1 outline-none"
                            placeholder="Workspace Name"
                            value={workspaceNames[0] || ""}
                            onChange={(e) => {
                                if (e.target.value !== "") {
                                    setWorkspaceNames((old) => ({ ...old, 0: e.target.value }));
                                }
                            }}
                        />
                        <Button
                            className="!text-green-600 !bg-green-200 disabled:!bg-gray-200 disabled:!text-gray-400 h-full"
                            disabled={
                                !workspace ||
                                workspace.getAllBlocks().length === 0 ||
                                workspaceNames[0] === "" ||
                                workspaceNames[0] === undefined ||
                                savedWorkspaces.find((w) => w.name === workspaceNames[0]) !== undefined
                            }
                            onClick={() => {
                                setSavedWorkspaces((old) => [...old, { name: workspaceNames[0]!, worksapce: save() }]);
                                setWorkspaceNames({});
                            }}
                        >
                            Save
                        </Button>
                    </div>
                    {workspace && (
                        <>
                            <div>{workspace.getAllBlocks().length} Blocks</div>
                            <div className="p-1 border border-gray-200 overflow-auto max-h-80">
                                {workspace.getAllBlocks().length > 0 ? (
                                    <WorkspacePreview
                                        workspace={save()}
                                        lazyLoadParentRef={currentWorkspaceWrapperRef}
                                    />
                                ) : (
                                    <div className="text-gray-400">Empty Worspace...</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Accordion>
            <Accordion title="Stored Workspaces" defaultOpen={false}>
                <div className="mt-4">
                    <div className="flex flex-row gap-2 flex-wrap">
                        {savedWorkspaces.map((ws, index) => (
                            <div key={index} className="flex flex-col gap-2 max-w-80">
                                <div className="flex flex-row gap-1 justify-between items-center">
                                    <div>{ws.name}</div>
                                    <Button
                                        className="!text-blue-600 !bg-blue-200 disabled:!bg-gray-200 disabled:!text-gray-400 h-full ml-auto"
                                        onClick={() => {
                                            load(ws.worksapce);
                                        }}
                                    >
                                        Load
                                    </Button>
                                    <Button
                                        className="!text-red-600 !bg-red-200 disabled:!bg-gray-200 disabled:!text-gray-400 h-full"
                                        onClick={() => {
                                            setSavedWorkspaces((old) => old.filter((_, i) => i !== index));
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </div>
                                <div className="p-1 border border-gray-200 overflow-auto max-h-80 max-w-80 min-w-80">
                                    <WorkspacePreview workspace={ws.worksapce} className="my-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Accordion>
        </div>
    );
}
