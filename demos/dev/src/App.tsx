import { Canvas, useGeneratedCode } from "@nephro-react/filters";
import { useEffect, useRef, useState } from "react";
import { Tabs, Tab } from "./components/tabs/Tabs";
import { Code } from "./components/Code";
import { DataPanel } from "./components/tabs/DataPanel";
import { MiscPanel } from "./components/tabs/MiscPanel";

function App() {
    const toolPanelRef = useRef<HTMLDivElement>(null);
    const [language] = useState(localStorage.getItem("language") ?? "en");
    const { code, json, xml } = useGeneratedCode();
    const [width, setWidth] = useState(document.documentElement.clientWidth - 500); // TODO: this is a hack
    const [height, setHeight] = useState(document.documentElement.clientHeight);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        handleResize();
    }, []);

    function handleResize() {
        setHeight(document.documentElement.clientHeight);
        const toolPanelWidth = toolPanelRef.current?.clientWidth ?? 0;
        setWidth(document.documentElement.clientWidth - toolPanelWidth);
    }

    return (
        <>
            <div className="flex flex-row">
                <div className="overflow-x-hidden border-r border-solid border-gray-200 grow">
                    <Canvas width={width} height={height} language={language} media="/media/" />
                </div>
                <div className="max-w-[500px] w-full max-h-screen min-h-screen" ref={toolPanelRef}>
                    <Tabs>
                        <Tab label="Data">
                            <DataPanel />
                        </Tab>
                        <Tab label="Misc">
                            <MiscPanel />
                        </Tab>
                        <Tab label="Code">
                            <Code language="typescript" code={code === "" ? "// no code" : code.split("\n\n\n")[1]} />
                        </Tab>
                        <Tab label="JSON">
                            <Code language="json" code={json} />
                        </Tab>
                        <Tab label="XML">
                            <Code language="xml" code={xml} />
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </>
    );
}

export default App;
