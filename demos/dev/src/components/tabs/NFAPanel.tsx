import { ImperativePanelGroupHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useEffect, useRef } from "react";
import { CodePanel } from "./NFACodePanel";
import { useMonaco } from "@monaco-editor/react";

function syncLayout(source: number[], targetRef: React.RefObject<ImperativePanelGroupHandle>) {
    const target = targetRef.current;
    if (!target) return;
    const current = target.getLayout();

    const isDifferent = source.length !== current.length || source.some((v, i) => v !== current[i]);

    if (isDifferent) {
        target.setLayout(source);
    }
}

// Add the rest of the ambient types needed here
const ambientTypes = `
    declare enum DateTimeGranularity {
        YEAR = "year",
        MONTH = "month",
        DAY = "day",
        HOUR = "hour",
        MINUTE = "minute",
        SECOND = "second",
    }

    declare class PatternBuilder {
        sequence(...patterns: Pattern[]): this;
        choice(...patterns: Pattern[]): this;
        repeat(pattern: Pattern, min?: number, max?: number): this;
        dateAnchor(date: MaskedDate): this;
        event(builder: (b: EventPatternBuilder) => EventPatternBuilder): this;
        build(): Pattern;
    }

    declare class EventPatternBuilder {
        matches(fn: (event: any) => boolean): this;
        optional(): this;
        occurrence(occurrence: EventOccurence): this;
        interval(setup: {
            max?: number,
            min?: number,
            unit?: DateTimeGranularity,
            relativeTo?: "lastAnchor" | "timelineStart" | "lastEventAnchor" | "lastDateAnchor"
        }): this;
        build(): EventPattern;
    }

    declare function buildPattern(): PatternBuilder;
`;


export function NFAPanel() {
    const topPanelRef = useRef<ImperativePanelGroupHandle>(null);
    const bottomPanelRef = useRef<ImperativePanelGroupHandle>(null);
    const monaco = useMonaco();

    useEffect(() => {
        if (!monaco) return;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            ambientTypes,
            "file:///globals.d.ts"
        );
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            noEmit: true,
            strict: true,
            esModuleInterop: true,
        });
    }, [monaco]);

    return (
        <PanelGroup direction="vertical" autoSaveId="nfa-vertical" className="h-full">
            {/* Top block (contains two linked rows) */}
            <Panel defaultSize={50}>
                <PanelGroup direction="vertical" autoSaveId="nfa-top-block">
                    {/* First row (horizontal split) */}
                    <Panel defaultSize={50}>
                        <PanelGroup
                            direction="horizontal"
                            autoSaveId="nfa-row1"
                            ref={topPanelRef}
                            onLayout={(l) => syncLayout(l, bottomPanelRef)}
                        >
                            <CodePanel
                                title="Timelines"
                                storageKey="nfa-timelines"
                                defaultCode={"// timeline definition code goes here"}
                            />
                        </PanelGroup>
                    </Panel>

                    <PanelResizeHandle className="border-t" />

                    {/* Second row (horizontal split) */}
                    <Panel defaultSize={50}>
                        <PanelGroup
                            direction="horizontal"
                            autoSaveId="nfa-row2"
                            ref={bottomPanelRef}
                            onLayout={(l) => syncLayout(l, topPanelRef)}
                        >
                            <CodePanel
                                title="Patterns"
                                storageKey="nfa-patterns"
                                defaultCode={"// pattern definition code goes here"}
                            />
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
            </Panel>

            <PanelResizeHandle className="border-t" />

            {/* Bottom full-width panel */}
            <Panel defaultSize={50}>
                <div>Viz</div>
            </Panel>
        </PanelGroup>
    );
}
