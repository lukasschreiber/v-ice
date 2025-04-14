import React, { createRef, useContext, useEffect, useState } from "react";
import * as Blockly from "blockly/core";
import { Renderer } from "@/renderer/renderer";
import { LightTheme } from "@/themes/themes";
import { ContinuousMetrics } from "@/toolbox/blockly/metrics";
import { ContinuousFlyout } from "@/toolbox/blockly/flyout";
import { ContinuousToolbox } from "@/toolbox/blockly/toolbox";
import { DefaultToolbox } from "@/toolbox/default_toolbox";
import { useTranslation } from "react-i18next";
import { SettingsContext } from "@/context/settings/settings_context";
import { SettingsModal } from "@/components/SettingsModal";
import { setBlocklyLocale } from "@/i18n";
import { setJson, setXml, setCode, setASTJson } from "@/store/code/generated_code_slice";
import { useDispatch, useSelector } from "@/store/hooks";
import { useSettingsHandlers } from "./hooks/useSettingsHandlers";
import { Blocks } from "@/blocks";
import { WorkspaceContext } from "@/context/workspace_context";
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
import { showHelp } from "@/context/manual/manual_emitter";
import { useHelp } from "@/context/manual/manual_hooks";
import { Tooltip } from "./common/Tooltip";
import { EmptyToolbox } from "@/toolbox/empty_toolbox";
import { LoadingOverlay } from "./common/LoadingOverlay";
import { getASTBuilderInstance } from "@/query/builder/ast_builder_instance";
import { setTheme } from "@/themes/colors";
import { QueryClient } from "@/query/clients/query_client";
import { LocalQueryClient } from "@/query/clients/local_query_client";
import { NodeBlock } from "@/blocks/extensions/node";
import { selectSourceDataTable } from "@/store/data/source_table_slice";
import { setResultTables } from "@/store/data/result_tables_slice";
import { NormalizedFitleredDataTable } from "@/data/filtered_table";
import { LayoutSettings, Settings } from "@/context/settings/settings";
import { createPortal } from "react-dom";
import { useWorkspacePersister } from "./hooks/useWorkspacePersister";
// import { SearchForm } from "./SearchForm";
import { Layer } from "@/utils/zindex";
import { FullScreenBlockDragger } from "@/renderer/full_screen_block_dragger";
import { setFeatureReady, setVariables } from "@/store/blockly/blockly_slice";
import types from "@/data/types";
import { BlocklyToolboxAdapter } from "@/toolbox/adapters/blockly_adapter";
import { ToolboxDefinition } from "@/toolbox/builder/definitions";
import { ReactToolbox } from "@/toolbox/react/ReactToolbox";
import { setLanguage } from "@/context/settings/settings_slice";
import { VariablesOverlay } from "./VariablesOverlay";
import { SearchForm } from "./SearchForm";

Blockly.Scrollbar.scrollbarThickness = 10;

export type CanvasProps = React.HTMLProps<HTMLDivElement> & {
    language?: string;
    media?: string;
    helpUrl?: string;
    toolbox?: ToolboxDefinition;
    queryClient?: QueryClient;
    theme?: Blockly.Theme;
    initialSettings?: Partial<Settings>;
    settingsVisibility?: Partial<Record<keyof Settings, boolean>>;
};

export function Canvas(props: CanvasProps) {
    const {
        language,
        theme,
        helpUrl,
        media,
        width,
        height,
        toolbox,
        queryClient,
        initialSettings,
        settingsVisibility,
        ...divProps
    } = props;

    const blocklyDiv = createRef<HTMLDivElement>();
    const { workspaceRef, setInitialized } = useContext(WorkspaceContext);
    const [toolboxWidth, setToolboxWidth] = useState(0);
    const isLoading = useSelector((state) => state.blockly.loading);
    const { i18n } = useTranslation();
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const {
        settings,
        set,
        layout,
        isHidden,
        isInitialized: settingsIninitialized,
        setInitialSettings,
        overrideVisibility,
    } = useContext(SettingsContext);
    const { setHelpUrl } = useHelp();
    const debuggingOptions = useSelector((state) => state.settings.debugger);
    const code = useSelector((state) => state.generatedCode.code);
    const astJson = useSelector((state) => state.generatedCode.astJson);
    const source = useSelector(selectSourceDataTable);
    const dispatch = useDispatch();

    useEffect(() => {
        setInitialSettings(initialSettings ?? {});
    }, [initialSettings, setInitialSettings]);

    useEffect(() => {
        overrideVisibility(settingsVisibility ?? {});
    }, [settingsVisibility, overrideVisibility]);

    useEffect(() => {
        setHelpUrl(helpUrl ?? null);
    }, [helpUrl, setHelpUrl]);

    useEffect(() => {
        i18n.changeLanguage(language);
        dispatch(setLanguage(language));
    }, [language, i18n]);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if (workspace) {
            Blockly.svgResize(workspace);
        }
    }, [width, height]);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if (source && workspace) {
            Blockly.Events.disable();
            const variables = workspace.getAllVariables();
            // add new variables
            for (const column of source.getColumns()) {
                if (variables.find((v) => v.name === column.name && v.type === column.type.name) === undefined) {
                    workspace.createVariable(column.name, column.type.name);
                }
            }

            // remove old variables
            for (const variable of variables) {
                if (!source.getColumns().find((c) => c.name === variable.name && c.type.name === variable.type)) {
                    workspace.deleteVariableById(variable.getId());
                }
            }

            dispatch(setVariables(workspace.getAllVariables().map((v) => ({ name: v.name, type: types.utils.fromString(v.type), id: v.getId() }))));
            Blockly.Events.enable();
        }

        if (workspace?.getAllVariables().length === source?.getColumns().length) {
            dispatch(setFeatureReady("variables"));
        }
    }, [source]);

    useEffect(() => {
        workspaceRef.current?.updateToolbox(new BlocklyToolboxAdapter(toolbox ?? EmptyToolbox).toToolboxDefinition());
        workspaceRef.current?.refreshToolboxSelection();
        dispatch(setFeatureReady("toolbox"));
    }, [toolbox]);

    const { isWorkspaceLoaded } = useWorkspacePersister();

    useEffect(() => {
        if (!isWorkspaceLoaded) return;
        dispatch(setFeatureReady("persistedWorkspace"));
    }, [isWorkspaceLoaded]);

    useEffect(() => {
        const div = blocklyDiv.current;
        if (div && settingsIninitialized) {
            // FIXME: this should be done in a better way, but it is needed for the build
            setBlocklyLocale(language ?? i18n.language);

            workspaceRef.current = Blockly.inject(div, {
                plugins: {
                    toolbox: ContinuousToolbox,
                    flyoutsVerticalToolbox: ContinuousFlyout,
                    metricsManager: ContinuousMetrics,
                    blockDragger: FullScreenBlockDragger,
                },
                media: media || "https://blockly-demo.appspot.com/static/media/",
                theme: theme ?? LightTheme,
                renderer: Renderer.name,
                grid: {
                    spacing: 40,
                },
                zoom: {
                    startScale: settings.zoom,
                },
                trashcan: false,
                toolbox: new BlocklyToolboxAdapter(toolbox ?? DefaultToolbox).toToolboxDefinition(),
                maxInstances: {
                    [Blocks.Names.NODE.SOURCE]: 1,
                },
                toolboxPosition: settings.toolboxPosition === "left" ? "start" : "end",
            });

            div.dataset.workspaceId = workspaceRef.current.id;

            dispatch(setFeatureReady("workspace"));
            setInitialized(true);

            if (debuggingOptions.blocklyXml || debuggingOptions.blocklyJson) {
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
                        if (debuggingOptions.blocklyJson) {
                            dispatch(
                                setJson(
                                    JSON.stringify(
                                        Blockly.serialization.workspaces.save(e.getEventWorkspace_()),
                                        null,
                                        2
                                    )
                                )
                            );
                        }

                        if (debuggingOptions.blocklyXml) {
                            dispatch(
                                setXml(Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(e.getEventWorkspace_())))
                            );
                        }

                        resolve();
                    });
                });

                workspaceRef.current!.addChangeListener((e) => {
                    if (e.type === Blockly.Events.VAR_CREATE || e.type === Blockly.Events.VAR_DELETE || e.type === Blockly.Events.VAR_RENAME) {
                        dispatch(
                            setVariables(workspaceRef.current!.getAllVariables().map((v) => ({ name: v.name, type: types.utils.fromString(v.type), id: v.getId() })))
                        );
                    }
                });
            }
        }

        return () => {
            // TODO: workspace should be disposed
            if (div) div.textContent = "";
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settingsIninitialized]);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if (!workspace) return;

        new Promise<void>(async (resolve) => {
            if (!queryClient) {
                resolve();
                return;
            }
            const result = await queryClient.execute(code);
            const normalized: Record<string, NormalizedFitleredDataTable> = {};
            for (const [id, table] of Object.entries(result.targets)) {
                normalized[id] = table.toNormalizedTable();
            }

            dispatch(setResultTables(normalized));
            dispatch(setEdgeCounts(result.edgeCounts));
            resolve();
        }).then(() => {
            // render the edges again
            const nodes = workspace.getAllBlocks().filter((b) => Blocks.Types.isNodeBlock(b));
            for (const node of nodes) {
                (workspace.getRenderer() as Renderer).renderEdges(node as NodeBlock & Blockly.BlockSvg);
            }
        });

        function saveCode(e: Blockly.Events.Abstract | null = null) {
            if (e === null) return;
            // for now we only update code if the action should be undoable, otherwise it is probably batched
            if (!e.recordUndo) return;

            if (workspace && workspace.getTopBlocks().length > 0) {
                const ast = getASTBuilderInstance().build(workspace);
                if (queryClient) {
                    queryClient
                        .generateCode(ast ?? "")
                        .then((code) => (queryClient as LocalQueryClient).optimizeCode(code))
                        .then((code) => (queryClient as LocalQueryClient).formatCode(code))
                        .then((code) => {
                            if (code !== astJson) {
                                dispatch(setCode(code));
                            }
                        });
                }

                const astJsonCode = JSON.stringify(ast, null, 2);

                if (astJson !== astJsonCode && debuggingOptions.ast) {
                    dispatch(setASTJson(astJsonCode));
                }
            }
        }

        workspace.addChangeListener(saveCode);
        return () => workspace.removeChangeListener(saveCode);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, code, debuggingOptions, queryClient]);

    useEffect(() => {
        function handleToolboxResize() {
            const toolboxDiv = blocklyDiv.current?.querySelector<HTMLDivElement>(".blocklyToolboxDiv");
            setToolboxWidth(toolboxDiv?.clientWidth ?? 0);
        }

        const div = blocklyDiv.current;
        if (div) {
            setToolboxWidth(div.querySelector(".blocklyToolboxDiv")?.clientWidth ?? 0);
            div.addEventListener("resize", handleToolboxResize);
            handleToolboxResize();
        }

        return () => div?.removeEventListener("resize", handleToolboxResize);
    }, [blocklyDiv]);

    useEffect(() => {
        if (workspaceRef.current) {
            setTheme(workspaceRef.current, theme ?? LightTheme);
        }
    }, [theme, workspaceRef.current]);

    useEffect(() => {
        const globalClickHandler = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest(".renderer-renderer") !== null) return;
            // hide all dropdowns, etc. when clicking outside the workspace
            workspaceRef.current?.hideChaff();
        };

        document.addEventListener("click", globalClickHandler);
        return () => document.removeEventListener("click", globalClickHandler);
    }, [workspaceRef.current]);

    useSettingsHandlers(workspaceRef, settings);

    return (
        <div className="overflow-hidden w-fit relative canvas-container">
            <LoadingOverlay isLoading={isLoading} />
            <div
                {...divProps}
                style={{ width: `${width}px`, height: `${height}px`, ...divProps.style }}
                className="relative"
                ref={blocklyDiv}
                id={"canvas"}
            ></div>
            {/* <SearchForm /> */}
            {/* <VariablesOverlay /> */}
            {settings.toolboxVersion === "rich" && <ReactToolbox definition={toolbox || DefaultToolbox} offset={toolboxWidth} height={Number(height)} />}
            <ButtonStack
                className={`absolute bottom-8 ${settings.toolboxPosition === "left" ? "right-8" : "left-8"}`}
                style={{ zIndex: Layer.FloatingButtons }}
            >
                {settings.showAutocomplete && (
                    <Tooltip text="Autocomplete" position={settings.toolboxPosition} className="text-text">
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
                )}
                {settings.showCenterControl && (
                    <Tooltip text="Zentrieren" position={settings.toolboxPosition} className="text-text">
                        <RoundButton
                            onClick={() => {
                                workspaceRef.current?.scrollCenter();
                                triggerAction(EvaluationAction.UseCenterButton);
                            }}
                        >
                            <CrosshairIcon className="w-5 h-5" />
                        </RoundButton>
                    </Tooltip>
                )}
                {settings.showZoomControls && (
                    <>
                        <Tooltip text="Reinzoomen" position={settings.toolboxPosition} className="text-text">
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
                        <Tooltip text="Rauszoomen" position={settings.toolboxPosition} className="text-text">
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
                    </>
                )}
            </ButtonStack>
            {(settings.showManual || settings.showSettings) && (
                <ToolboxButtonStack style={{ width: `${toolboxWidth}px` }}>
                    {settings.showManual && (
                        <Tooltip
                            text="Handbuch"
                            className="text-text"
                            position={settings.toolboxPosition === "left" ? "right" : "left"}
                        >
                            <ToolboxButton onClick={() => showHelp("#help-start")}>
                                <BookOpenIcon className="h-6 w-6 text-white" />
                            </ToolboxButton>
                        </Tooltip>
                    )}
                    {Object.keys(settings).some((p) => !isHidden(p as keyof LayoutSettings)) &&
                        settings.showSettings && (
                            <Tooltip
                                text="Einstellungen"
                                className="text-text"
                                position={settings.toolboxPosition === "left" ? "right" : "left"}
                            >
                                <ToolboxButton
                                    onClick={() => setSettingsModalOpen((old) => !old)}
                                    className="bg-primary-400"
                                >
                                    <SettingsIcon className="h-6 w-6 text-white" />
                                </ToolboxButton>
                            </Tooltip>
                        )}
                </ToolboxButtonStack>
            )}
            {createPortal(
                <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />,
                document.body
            )}
        </div>
    );
}
