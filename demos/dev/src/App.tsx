import { Canvas, useGeneratedCode, ToolboxDefinition, Toolbox, Themes, Clients } from "v-ice";
import { useCallback, useEffect, useState } from "react";
import { Tabs, Tab } from "./components/tabs/Tabs";
import { Code } from "./components/Code";
import { DataPanel } from "./components/tabs/DataPanel";
import { Button, useLocalStorage } from "v-ice-commons";
import { MiscPanel } from "./components/tabs/MiscPanel";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ToolboxPanel } from "./components/tabs/ToolboxPanel";
import { WorkspaceSavePanel } from "./components/tabs/WorspaceSavePanel";
import { showNotification } from "@/context/notifications/notification_emitter";

function App() {
    const [language] = useState(localStorage.getItem("language") ?? "en");
    const [queryClient, setQueryClient] = useState("js");
    const { json, xml, astJson, code } = useGeneratedCode();
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [themeName, setThemeName] = useLocalStorage("theme", "light");
    const [size, setSize] = useState(75);
    const [orientation, setOrientation] = useLocalStorage<"horizontal" | "vertical">("panel-direction", "horizontal");
    const [toolbox, setToolbox] = useState<ToolboxDefinition>(Toolbox.Defaults.Complete);

    useEffect(() => {
        window.addEventListener("resize", () => {
            if (orientation === "horizontal") {
                setHeight(document.documentElement.clientHeight);
                setWidth((document.documentElement.clientWidth * size) / 100);
            } else {
                setHeight((document.documentElement.clientHeight * size) / 100);
                setWidth(document.documentElement.clientWidth);
            }
        });
    }, [size, orientation]);

    const handleResize = useCallback(
        (size: number) => {
            setSize(size);
        },
        [orientation]
    );

    useEffect(() => {
        if (orientation === "horizontal") {
            setHeight(document.documentElement.clientHeight);
            setWidth((document.documentElement.clientWidth * size) / 100);
        } else {
            setHeight((document.documentElement.clientHeight * size) / 100);
            setWidth(document.documentElement.clientWidth);
        }
    }, [orientation, size]);

    return (
        <>
            <PanelGroup autoSaveId={"main-panel"} direction={orientation} className="!w-screen !h-screen">
                <Panel
                    defaultSize={75}
                    onResize={(size) => handleResize(size)}
                    className="border-r border-solid border-gray-200"
                >
                    <Canvas
                        width={width}
                        height={height}
                        language={language}
                        media="/media/"
                        toolbox={toolbox}
                        theme={themeName === "light" ? Themes.LightTheme : Themes.DarkTheme}
                        queryClient={Clients[queryClient as keyof typeof Clients]}
                    />
                </Panel>
                <PanelResizeHandle />
                <Panel defaultSize={25}>
                    <Tabs orientation={orientation} setOrientation={setOrientation}>
                        <Tab label="Data" description="Manage the test data">
                            <DataPanel />
                        </Tab>
                        <Tab label="Misc" description="Some random functions">
                            <MiscPanel
                                theme={themeName === "light" ? Themes.LightTheme : Themes.DarkTheme}
                                setTheme={(theme) => setThemeName(theme.name)}
                            />
                        </Tab>
                        <Tab label="Toolbox" description="Toolbox configuration">
                            <ToolboxPanel toolbox={toolbox} setToolbox={setToolbox} />
                        </Tab>
                        <Tab label="Workspaces" description="Manage different workspace saves">
                            <WorkspaceSavePanel />
                        </Tab>
                        <Tab label="Code" description="The generated JavaScript code">
                            <div className="absolute bottom-2 left-2 p-2 flex flex-row gap-2 text-xs shadow-lg border-gray-200 rounded-md border z-[1000]">
                                <select
                                    className="bg-white rounded-sm border-slate-300 border border-solid"
                                    value={queryClient}
                                    onChange={(e) => {
                                        setQueryClient(e.target.value);
                                    }}
                                >
                                    {Object.keys(Clients).map((key) => (
                                        <option key={key} value={key}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    onClick={() => showNotification("No Action has been performed")}
                                >
                                    Run
                                </Button>
                            </div>

                            <Code
                                language="javascript"
                                code={code === "" ? "// no code" : code}
                                decorations={[
                                    { regex: /(?<=function\s+)(query_\w*)/g, className: "bg-orange-200" },
                                    { regex: /(?<=function\s+)(set_\w*)/g, className: "bg-purple-200" },
                                    { regex: /"[a-zA-Z0-9,=()@|/{}\$~\*!:;\+\-`#^%?\[\]\._]{20}"/g, className: "bg-green-50 text-green-300" },
                                ]}
                            />
                        </Tab>
                        <Tab label="AST" description="The generated JSON reperesentation of the code">
                            <Code language="json" code={astJson} />
                        </Tab>
                        <Tab label="JSON" description="The worspace as JSON">
                            <Code language="json" code={json} />
                        </Tab>
                        <Tab label="XML" description="The workspace as XML">
                            <Code language="xml" code={xml} />
                        </Tab>
                    </Tabs>
                </Panel>
            </PanelGroup>
        </>
    );
}

export default App;
