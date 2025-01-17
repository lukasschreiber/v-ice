import { Canvas, useGeneratedCode, ToolboxDefinition, Toolbox, Themes } from "v-ice";
import { useCallback, useEffect, useState } from "react";
import { Tabs, Tab } from "./components/tabs/Tabs";
import { Code } from "./components/Code";
import { DataPanel } from "./components/tabs/DataPanel";
import { useLocalStorage } from "v-ice-commons";
import { MiscPanel } from "./components/tabs/MiscPanel";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ToolboxPanel } from "./components/tabs/ToolboxPanel";
import { WorkspaceSavePanel } from "./components/tabs/WorspaceSavePanel";

function App() {
    const [language] = useState(localStorage.getItem("language") ?? "en");
    const { code, json, xml, queryJson } = useGeneratedCode();
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [theme, setTheme] = useState(Themes.LightTheme);
    const [size, setSize] = useState(75);
    const [orientation, setOrientation] = useLocalStorage<"horizontal" | "vertical">("panel-direction", "horizontal");
    const [toolbox, setToolbox] = useState<ToolboxDefinition>(Toolbox.Defaults.Complete);

    useEffect(() => {
        window.addEventListener("resize", () => {
            if (orientation === "horizontal") {
                setHeight(document.documentElement.clientHeight);
                setWidth(document.documentElement.clientWidth * size / 100);
            } else {
                setHeight(document.documentElement.clientHeight * size / 100);
                setWidth(document.documentElement.clientWidth);
            }
        });
    }, [size, orientation]);

    const handleResize = useCallback((size: number) => {
        setSize(size);
    }, [orientation]);

    useEffect(() => {
        if (orientation === "horizontal") {
            setHeight(document.documentElement.clientHeight);
            setWidth(document.documentElement.clientWidth * size / 100);
        } else {
            setHeight(document.documentElement.clientHeight * size / 100);
            setWidth(document.documentElement.clientWidth);
        }
    }, [orientation, size])

    return (
        <>
            <PanelGroup autoSaveId={"main-panel"} direction={orientation} className="!w-screen !h-screen">
                <Panel defaultSize={75} onResize={(size) => handleResize(size)} className="border-r border-solid border-gray-200">
                    <Canvas width={width} height={height} language={language} media="/media/" toolbox={toolbox} theme={theme} />
                </Panel>
                <PanelResizeHandle />
                <Panel defaultSize={25}>
                    <Tabs orientation={orientation} setOrientation={setOrientation}>
                        <Tab label="Data" description="Manage the test data">
                            <DataPanel />
                        </Tab>
                        <Tab label="Misc" description="Some random functions">
                            <MiscPanel theme={theme} setTheme={setTheme} />
                        </Tab>
                        <Tab label="Toolbox" description="Toolbox configuration">
                            <ToolboxPanel toolbox={toolbox} setToolbox={setToolbox} />
                        </Tab>
                        <Tab label="Workspaces" description="Manage different workspace saves">
                            <WorkspaceSavePanel />
                        </Tab>
                        <Tab label="Code" description="The generated JavaScript code">
                            <Code language="typescript" code={code === "" ? "// no code" : code.split("\n\n\n")[1]} />
                        </Tab>
                        <Tab label="AST" description="The generated JSON reperesentation of the code">
                            <Code language="json" code={queryJson} />
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
