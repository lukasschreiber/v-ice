import { useWorkspace } from "@/main";
import { getBlockHeightWidth } from "@/renderer/block_metric_approximator";
import { useSelector } from "@/store/hooks";
import { Variables } from "@/toolbox/categories/variables";
import { ReactToolboxBlockRow } from "@/toolbox/react/ReactToolboxBlockRow";
import { getBlockTextFromBlockDefinition } from "@/utils/blocks";
import { Layer } from "@/utils/zindex";
import { CSSProperties, useCallback, useMemo, useRef, useState } from "react";
import { VariableSizeList } from "react-window";

export function SearchForm(props: { onClose: () => void }) {
    const listRef = useRef<VariableSizeList>(null);
    const { workspace } = useWorkspace();
    const scale = useSelector((state) => state.settings.settings.zoom);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const overscanCount = useSelector((state) => state.settings.settings.reactToolboxOverscan);

    const PADDING = 6;
    const MARGIN = 4;

    const variableBlocks = useMemo(() => {
        const blocks = new Variables().getBlocks(workspace).filter((block) => {
            if (block.type !== "variable_get") return false;

            if (getBlockTextFromBlockDefinition(block).toLowerCase().includes(searchTerm.toLowerCase())) {
                return true;
            }

            return false;
        });
        return blocks;
    }, [workspace, searchTerm]);

    const itemMetrics = useMemo(() => {
        return variableBlocks.map((block) => {
            const metrics = getBlockHeightWidth(block, scale);
            return {
                width: metrics.width,
                height: metrics.height + 2 * PADDING + 2 * MARGIN,
            };
        });
    }, [variableBlocks, scale]);

    const getItemSize = useCallback((index: number) => itemMetrics[index].height || 50, [itemMetrics]);

    const rowRenderer = useCallback(
        ({ index, style }: { index: number; style: CSSProperties }) => {
            const block = variableBlocks[index];

            const metrics = itemMetrics[index];
            return (
                <div style={style} onMouseDown={() => props.onClose()}>
                    <ReactToolboxBlockRow
                        block={block}
                        width={metrics.width}
                        height={metrics.height - 2 * PADDING - 2 * MARGIN}
                        padding={PADDING}
                        noHighlight
                        noFavorite
                    />
                </div>
            );
        },
        [variableBlocks, itemMetrics]
    );

    return (
        <div
            className="absolute top-0 left-0 right-0 bottom-0 backdrop-blur-md flex items-center justify-center"
            style={{ zIndex: Layer.SearchOverlay }}
            onClick={props.onClose}
        >
            <div
                className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center justify-between w-fit"
                onClick={(e) => e.stopPropagation()}
            >
                <input
                    autoFocus
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search"
                    className="border border-gray-300 p-2 rounded-lg outline-none w-full"
                />
                <div>
                    <VariableSizeList
                        ref={listRef}
                        height={500}
                        itemCount={variableBlocks.length}
                        itemSize={getItemSize}
                        width={300}
                        overscanCount={overscanCount}
                    >
                        {rowRenderer}
                    </VariableSizeList>
                </div>
            </div>
        </div>
    );
}
