import React, { CSSProperties, useContext } from "react";
import { ReactToolboxCategoryRow } from "./ReactToolboxCategoryRow";
import { ReactToolboxBlockRow } from "./ReactToolboxBlockRow";
import { ToolboxLayoutContext, ToolboxMetaContext } from "./ReactToolboxContext";
import { useSelector } from "@/store/hooks";

export const ReactToolBoxRowRenderer = React.memo(
    function ReactToolBoxRowRenderer({ index, style }: { index: number; style: CSSProperties }) {
        const { padding, margin } = useContext(ToolboxMetaContext);
        const { getItem, getItemSize } = useContext(ToolboxLayoutContext);
        const showFavorites = useSelector((state) => state.settings.settings.toolboxFavorites);

        const item = getItem(index);

        if (item.kind === "category") {
            return (
                <ReactToolboxCategoryRow
                    key={item.id}
                    item={item}
                    style={style}
                />
            );
        }

        if (item.kind === "empty") {
            return (
                <div
                    key={item.id}
                    className="flex items-center justify-center text-gray-500 text-xs"
                    style={{
                        ...style,
                        backgroundColor: "transparent",
                    }}
                >
                    No blocks found
                </div>
            );
        }

        const metrics = getItemSize(index);
        return (
            <div style={style}>
                <ReactToolboxBlockRow
                    block={item.block}
                    width={metrics.width}
                    height={metrics.height - 2 * padding - 2 * margin}
                    padding={padding}
                    noHighlight={item.noHighlight}
                    noFavorite={!showFavorites}
                />
            </div>
        );
    },
);
