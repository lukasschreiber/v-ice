import { GenericBlockDefinition, ToolboxDefinition } from "@/toolbox/builder/definitions";
import { ReactToolboxProvider } from "./ReactToolboxContext";
import { Layer } from "@/utils/zindex";
import { VariableSizeList as List } from "react-window";
import { useSettings, useWorkspace } from "@/main";
import { evaluateIsHiddenFunc, hasIsHiddenFunc } from "@/toolbox/utils";
import { useSelector } from "@/store/hooks";
import { CSSProperties, useCallback, useEffect, useMemo, useRef } from "react";
import { getBlockHeightWidth } from "@/renderer/block_metric_approximator";
import { ReactToolboxRow } from "./ReactToolboxRow";
import * as Blockly from "blockly/core";
import emitter from "@/context/category_scroll_emitter";

type FlattendToolboxEntry = { kind: "block"; block: GenericBlockDefinition } | { kind: "category"; title: string; id: string };

export function ReactToolbox(props: { definition: ToolboxDefinition; offset: number; height: number }) {
    const { settings } = useSettings();
    const { workspace } = useWorkspace();
    const columns = useSelector((state) => state.sourceTable.columns);
    const variablesReady = useSelector((state) => state.blockly.featuresReady.variables);
    const scale = useSelector((state) => state.settings.settings.zoom);
    const listRef = useRef<List>(null);

    const PADDING = 6;
    const MARGIN = 4;
    const MAX_WIDTH = 450;

    const flattenedToolbox = useMemo(() => {
        if (!workspace || !variablesReady) {
            return [];
        }


        const result: FlattendToolboxEntry[] = [];
        for (const category of props.definition) {
            if (hasIsHiddenFunc(category)) {
                if (evaluateIsHiddenFunc(category, workspace, columns)) {
                    continue;
                }
            }

            result.push({ kind: "category", title: category.name, id: category.id });

            const blocks = category.kind === "static" ? category.blocks : category.instance.getBlocks(workspace);
            for (const block of blocks) {
                if (hasIsHiddenFunc(block)) {
                    if (evaluateIsHiddenFunc(block, workspace, columns)) {
                        continue;
                    }
                }

                result.push({ kind: "block", block });
            }
        }

        return result;
    }, [props.definition, workspace, columns, variablesReady]);

    const itemMetrics = useMemo(() => {
        return flattenedToolbox.map((entry) => {
            if (entry.kind === "category") {
                return { width: 0, height: 40 };
            } else {
                const metrics = getBlockHeightWidth(entry.block, scale);
                return {
                    width: metrics.width,
                    height: metrics.height + 2 * PADDING + 2 * MARGIN,
                };
            }
        });
    }, [flattenedToolbox, scale]);

    const getItemSize = useCallback(
        (index: number) => {
            return itemMetrics[index].height || 50;
        },
        [itemMetrics]
    );

    const listWidth = useMemo(() => {
        return Math.min(Math.max(...itemMetrics.map((m) => m.width || 0)) + 40, MAX_WIDTH); // some extra space for the "star"
    }, [itemMetrics]);

    const scrollToCategory = useCallback((category: string) => {
        const index = flattenedToolbox.findIndex((entry) => entry.kind === "category" && entry.id === category);
        if (index !== -1) {
            listRef.current?.scrollToItem(index, "start");
        }
    }, [flattenedToolbox]);

    useEffect(() => {
        emitter.on("scrollToCategory", scrollToCategory);
        return () => {
            emitter.off("scrollToCategory", scrollToCategory);
        };
    }, [scrollToCategory]);


    const rowRenderer = useCallback(
        ({ index, style }: { index: number; style: CSSProperties }) => {
            const item = flattenedToolbox[index];

            if (item.kind === "category") {
                return (
                    <h3 className="text-xs font-bold mb-2 p-2" id={item.id} style={{...style}}>{Blockly.utils.parsing.replaceMessageReferences(item.title)}</h3>
                );
            }

            const metrics = itemMetrics[index];

            return (
                <div style={style}>
                    <ReactToolboxRow block={item.block} width={metrics.width} height={metrics.height - 2 * PADDING - 2 * MARGIN} padding={PADDING} />
                </div>
            );
        },
        [flattenedToolbox, itemMetrics]
    );

    return (
        <ReactToolboxProvider>
            <div
                className="absolute top-0 w-fit flex gap-2 flex-col max-h-full overflow-y-auto bg-toolbox-bg/90 toolbox-container"
                data-deletezone={true}
                style={{
                    zIndex: Layer.Toolbox,
                    left: settings.toolboxPosition === "left" ? props.offset : "unset",
                    right: settings.toolboxPosition === "right" ? props.offset : "unset",
                    height: `calc(100% - 2px)`,
                    top: "1px",
                }}
            >
                <List
                    ref={listRef}
                    height={props.height}
                    itemCount={flattenedToolbox.length}
                    itemSize={getItemSize}
                    width={listWidth}
                    overscanCount={10}
                >
                    {rowRenderer}
                </List>
            </div>
        </ReactToolboxProvider>
    );
}
