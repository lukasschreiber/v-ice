import { Canvas, useGeneratedCode } from "v-ice";
import { useEffect, useRef, useState } from "react";
import { Tabs, Tab } from "./components/tabs/Tabs";
import { Code } from "./components/Code";
import { DataPanel } from "./components/tabs/DataPanel";
import { MiscPanel } from "./components/tabs/MiscPanel";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

function App() {
    const [language] = useState(localStorage.getItem("language") ?? "en");
    const { code, json, xml, queryJson } = useGeneratedCode();
    const [width, setWidth] = useState(document.documentElement.clientWidth - 500); // TODO: this is a hack
    const [height, setHeight] = useState(document.documentElement.clientHeight);
    const [size, setSize] = useState(75);

    useEffect(() => {
        window.addEventListener("resize", () => {
            setHeight(document.documentElement.clientHeight);
            setWidth(document.documentElement.clientWidth * size / 100);
        });
    }, [size]);

    function handleResize(size: number) {
        setSize(size);
        setHeight(document.documentElement.clientHeight);
        setWidth(document.documentElement.clientWidth * size / 100);
    }

    return (
        <>
            <PanelGroup autoSaveId={"main-panel"} direction="horizontal" className="!w-screen !h-screen">
                <Panel defaultSize={75} onResize={(size) => handleResize(size)} className="border-r border-solid border-gray-200">
                    <Canvas width={width} height={height} language={language} media="/media/" />
                </Panel>
                <PanelResizeHandle />
                <Panel defaultSize={25}>
                    <Tabs>
                        <Tab label="Data" description="Manage the test data">
                            <DataPanel />
                        </Tab>
                        <Tab label="Misc" description="Some random functions">
                            <MiscPanel />
                        </Tab>
                        <Tab label="Code" description="The generated JavaScript code">
                            <Code language="typescript" code={code === "" ? "// no code" : code.split("\n\n\n")[1]} />
                        </Tab>
                        <Tab label="QueryJSON" description="The generated JSON reperesentation of the code">
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
