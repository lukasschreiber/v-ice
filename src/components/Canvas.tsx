import React, { createRef, useContext, useEffect, useMemo, useState } from "react";
import * as Blockly from "blockly/core";
import { Renderer } from "@/renderer/renderer";
import LightTheme from "@/themes/light_theme";
import { ContinuousMetrics } from "@/toolbox/metrics";
import { ContinuousFlyout } from "@/toolbox/flyout";
import { ContinuousToolbox } from "@/toolbox/toolbox";
import { DefaultToolbox } from "@/blocks/toolbox/default_toolbox";
import { useTranslation } from "react-i18next";
import { BlockDragger } from "@/renderer/block_dragger";
import { SettingsContext } from "@/store/settings/settings_context";
import { SettingsModal } from "@/components/SettingsModal";
import { setBlocklyLocale } from "@/i18n";
import { queryGenerator } from "@/generation";
import { runQuery } from "@/generation/query_runner";
import { setJson, setXml, setCode } from "@/store/code/generated_code_slice";
import { setQueryResults } from "@/store/data/data_slice";
import { useDispatch, useSelector } from "@/store/hooks";
import { DataTable, SerializedTable } from "@/data/table";
import { useSettingsHandlers } from "./hooks/useSettingsHandlers";
import "@/connection_checker";
import { Blocks } from "@/blocks";
import { WorkspaceContext } from "@/workspace_context";
import { ButtonStack } from "./common/ButtonStack";
import { RoundButton } from "./common/RoundButton";
import ZoomMinusIcon from "@/assets/ZoomMinusIcon.svg?react";
import ZoomPlusIcon from "@/assets/ZoomPlusIcon.svg?react";
import CrosshairIcon from "@/assets/CrosshairIcon.svg?react";
import MagicWandIcon from "@/assets/MagicWandIcon.svg?react";
import SettingsIcon from "@/assets/SettingsIcon.svg?react";
import BookOpenIcon from "@/assets/BookOpenIcon.svg?react";
import { setEdgeCounts } from "@/store/blockly/edge_count_slice";
import { QueryMagicWand } from "@/query_magic_wand";
import { EvaluationAction, triggerAction } from "@/evaluation_emitter";
import { ISerializedWorkspace, serializeWorkspace } from "@/serializer";
import { ToolboxButton, ToolboxButtonStack } from "./ToolboxButton";
import { showHelp } from "@/store/help/help_emitter";
import { useHelp } from "@/store/help/help_hooks";
import { Tooltip } from "./common/Tooltip";

Blockly.Scrollbar.scrollbarThickness = 10;

try {
    Blockly.blockRendering.register(Renderer.name, Renderer);
} catch (e) {
    console.log("Renderer has already been registered");
}

export type CanvasProps = React.HTMLProps<HTMLDivElement> & {
    language?: string;
    media?: string;
    helpUrl?: string;
};

export function Canvas(props: CanvasProps) {
    const blocklyDiv = createRef<HTMLDivElement>();
    const workspaceRef = useContext(WorkspaceContext).workspaceRef;
    const [toolboxWidth, setToolboxWidth] = useState(0);
    const { i18n } = useTranslation();
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const { settings, set, layout } = useContext(SettingsContext);
    const { setHelpUrl } = useHelp();
    const code = useSelector((state) => state.generatedCode.code);
    const source = useSelector((state) => state.data.source);
    const memoizedSource = useMemo(() => DataTable.deserialize(source), [source]);
    const dispatch = useDispatch();

    const { language, helpUrl, media, width, height, ...divProps } = props;

    useEffect(() => {
        setHelpUrl(helpUrl ?? null);
    }, [helpUrl, setHelpUrl]);

    useEffect(() => {
        i18n.changeLanguage(language);
    }, [language, i18n]);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if (workspace) {
            Blockly.svgResize(workspace);
        }
    }, [width, height]);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if (memoizedSource && workspace) {
            Blockly.Events.disable();
            const variables = workspace.getAllVariables();
            // add new variables
            for (const column of memoizedSource.getColumns()) {
                if (variables.find((v) => v.name === column.name && v.type === column.type.name) === undefined) {
                    workspace.createVariable(column.name, column.type.name);
                }
            }

            // remove old variables
            for (const variable of variables) {
                if (
                    !memoizedSource.getColumns().find((c) => c.name === variable.name && c.type.name === variable.type)
                ) {
                    workspace.deleteVariableById(variable.getId());
                }
            }
            Blockly.Events.enable();
        }
    }, [memoizedSource]);

    useEffect(() => {
        const div = blocklyDiv.current;
        if (div) {
            // FIXME: this should be done in a better way, but it is needed for the build
            setBlocklyLocale(props.language ?? i18n.language);

            workspaceRef.current = Blockly.inject(div, {
                plugins: {
                    toolbox: ContinuousToolbox,
                    flyoutsVerticalToolbox: ContinuousFlyout,
                    metricsManager: ContinuousMetrics,
                    blockDragger: BlockDragger,
                },
                media: media || "https://blockly-demo.appspot.com/static/media/",
                theme: LightTheme,
                renderer: Renderer.name,
                grid: {
                    spacing: 40,
                },
                trashcan: false,
                toolbox: DefaultToolbox,
                maxInstances: {
                    [Blocks.Names.NODE.SOURCE]: 1,
                },
            });

            let lastWorkspaceState: ISerializedWorkspace | undefined = undefined;
            workspaceRef.current!.addChangeListener((e) => {
                if (
                    e.type === Blockly.Events.BLOCK_CREATE ||
                    e.type === Blockly.Events.BLOCK_DELETE ||
                    (e.type === Blockly.Events.BLOCK_MOVE &&
                        (e as Blockly.Events.BlockMove).reason?.find((r) =>
                            ["connect", "drag", "disconnect"].includes(r)
                        ))
                ) {
                    const workspaceState = serializeWorkspace(workspaceRef.current!);
                    if (
                        JSON.stringify(workspaceState.workspaceState) !==
                        JSON.stringify(lastWorkspaceState?.workspaceState)
                    ) {
                        triggerAction(EvaluationAction.WorkspaceChanged, { workspaceState });
                        lastWorkspaceState = workspaceState;
                    }
                }

                new Promise<void>((resolve) => {
                    // those dispatches should only be called if the user is interested in the data
                    dispatch(
                        setJson(JSON.stringify(Blockly.serialization.workspaces.save(e.getEventWorkspace_()), null, 2))
                    );
                    dispatch(setXml(Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(e.getEventWorkspace_()))));

                    resolve();
                });
            });
        }

        return () => {
            // TODO: workspace should be disposed
            if (div) div.textContent = "";
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if (!workspace) return;

        // this has been deserialized after running the query and is now serialized again... maybe we can take a shortcut from rows to json
        new Promise<void>((resolve) => {
            const result = runQuery(code, memoizedSource);
            const serialized: Record<string, SerializedTable> = {};
            for (const [id, table] of Object.entries(result.targets)) {
                serialized[id] = table.serialize();
            }

            dispatch(setQueryResults(serialized));
            dispatch(setEdgeCounts(result.edgeCounts));
            resolve();
        });

        // render the edges again
        const nodes = workspace.getAllBlocks().filter((b) => Blocks.Types.isNodeBlock(b));
        for (const node of nodes) {
            (workspace.getRenderer() as Renderer).renderEdges(node);
        }

        function saveCode(e: Blockly.Events.Abstract | null = null) {
            if (
                (e?.type === Blockly.Events.BLOCK_MOVE &&
                    !(e as Blockly.Events.BlockMove).reason?.includes("connect")) ||
                e?.type === Blockly.Events.VIEWPORT_CHANGE
            )
                return;

            const query = queryGenerator.workspaceToCode(workspace!);
            if (code !== query) {
                dispatch(setCode(query));
            }
        }

        saveCode();

        workspace.addChangeListener(saveCode);

        return () => workspace.removeChangeListener(saveCode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [memoizedSource, code]);

    useEffect(() => {
        function handleToolboxResize(event: UIEvent) {
            setToolboxWidth((event.target as HTMLElement).querySelector(".blocklyToolboxDiv")?.clientWidth ?? 0);
        }

        const div = blocklyDiv.current;
        if (div) {
            setToolboxWidth(div.querySelector(".blocklyToolboxDiv")?.clientWidth ?? 0);
            div.addEventListener("resize", handleToolboxResize);
        }

        return () => div?.removeEventListener("resize", handleToolboxResize);
    }, [blocklyDiv]);

    useSettingsHandlers(workspaceRef, settings);

    return (
        <>
            <div className="overflow-hidden w-fit relative">
                <div
                    {...divProps}
                    style={{ width: `${width}px`, height: `${height}px`, ...divProps.style }}
                    className="relative"
                    ref={blocklyDiv}
                    id={"canvas"}
                ></div>
                <ButtonStack className="absolute bottom-8 right-8 z-[1000]">
                    <Tooltip text="Autocomplete" position="left">
                        <RoundButton
                            disabled={!workspaceRef.current || !QueryMagicWand.canAutoComplete(workspaceRef.current)}
                            onClick={() => {
                                triggerAction(EvaluationAction.UseMagicWand, {
                                    workspaceState: serializeWorkspace(workspaceRef.current!),
                                });
                                QueryMagicWand.autoComplete(workspaceRef.current!);
                            }}
                        >
                            <MagicWandIcon className="w-5 h-5" />
                        </RoundButton>
                    </Tooltip>
                    <Tooltip text="Zentrieren" position="left">
                        <RoundButton
                            onClick={() => {
                                workspaceRef.current?.scrollCenter();
                                triggerAction(EvaluationAction.UseCenterButton);
                            }}
                        >
                            <CrosshairIcon className="w-5 h-5" />
                        </RoundButton>
                    </Tooltip>
                    <Tooltip text="Reinzoomen" position="left">
                        <RoundButton
                            onClick={() => {
                                set(
                                    "zoom",
                                    Math.min(
                                        settings.zoom + 0.1,
                                        layout.find((g) => g.settings.zoom)!.settings.zoom!.max
                                    )
                                );
                                triggerAction(EvaluationAction.UseZoomInButton);
                            }}
                            disabled={settings.zoom === layout.find((g) => g.settings.zoom)!.settings.zoom!.max}
                        >
                            <ZoomPlusIcon className="w-5 h-5" />
                        </RoundButton>
                    </Tooltip>
                    <Tooltip text="Rauszoomen" position="left">
                        <RoundButton
                            onClick={() => {
                                set(
                                    "zoom",
                                    Math.max(
                                        settings.zoom - 0.1,
                                        layout.find((g) => g.settings.zoom)!.settings.zoom!.min
                                    )
                                );
                                triggerAction(EvaluationAction.UseZoomOutButton);
                            }}
                            disabled={settings.zoom === layout.find((g) => g.settings.zoom)!.settings.zoom!.min}
                        >
                            <ZoomMinusIcon className="w-5 h-5" />
                        </RoundButton>
                    </Tooltip>
                </ButtonStack>
                <ToolboxButtonStack style={{ width: `${toolboxWidth}px` }}>
                    <Tooltip text="Handbuch">
                        <ToolboxButton onClick={() => showHelp("#help-start")}>
                            <BookOpenIcon className="h-6 w-6 text-white" />
                        </ToolboxButton>
                    </Tooltip>
                    <Tooltip text="Einstellungen">
                        <ToolboxButton onClick={() => setSettingsModalOpen((old) => !old)} className="bg-primary-400">
                            <SettingsIcon className="h-6 w-6 text-white" />
                        </ToolboxButton>
                    </Tooltip>
                </ToolboxButtonStack>
                <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
            </div>
        </>
    );
}
