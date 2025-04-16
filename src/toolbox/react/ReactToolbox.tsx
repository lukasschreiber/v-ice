import { ToolboxDefinition } from "@/toolbox/builder/definitions";
import { ReactToolboxProvider, ToolboxLayoutContext, ToolboxMetaContext, ToolboxUIContext } from "./ReactToolboxContext";
import { Layer } from "@/utils/zindex";
import { VariableSizeList as List } from "react-window";
import { useSettings } from "@/main";
import React, { useCallback, useContext, useEffect, useRef } from "react";
import emitter from "@/context/category_scroll_emitter";
import { ReactToolBoxRowRenderer } from "./ReactToolboxRowRenderer";

export const ReactToolbox = React.memo(
    function ReactToolbox({
        definition,
        offset,
        height,
    }: {
        definition: ToolboxDefinition;
        offset: number;
        height: number;
    }) {
        return (
            <ReactToolboxProvider definition={definition}>
                <ReactToolboxList definition={definition} offset={offset} height={height} />
            </ReactToolboxProvider>
        );
    },
);

function ReactToolboxList(props: { definition: ToolboxDefinition; offset: number; height: number }) {
    const { settings } = useSettings();
    const { getItemHeight, itemCount, width } = useContext(ToolboxLayoutContext);
    const { getCategoryIndex } = useContext(ToolboxMetaContext);
    const { searchTerm, setSearchTerm } = useContext(ToolboxUIContext);

    const listRef = useRef<List>(null);

    const scrollToCategory = useCallback(
        (category: string) => {
            const index = getCategoryIndex(category);
            if (index !== -1) {
                listRef.current?.scrollToItem(index, "start");
            }
        },
        [getCategoryIndex]
    );

    useEffect(() => {
        emitter.on("scrollToCategory", scrollToCategory);
        return () => {
            emitter.off("scrollToCategory", scrollToCategory);
        };
    }, [scrollToCategory]);

    useEffect(() => {
        listRef.current?.resetAfterIndex(0, true);
    }, [getItemHeight]);

    return (
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
            {settings.toolboxGlobalSearch && <div>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSearchTerm(value);
                    }}
                    className="w-full p-2 border rounded"
                />
            </div>}
            <List
                ref={listRef}
                height={props.height}
                itemCount={itemCount}
                itemSize={getItemHeight}
                width={width}
                overscanCount={settings.reactToolboxOverscan}
            >
                {ReactToolBoxRowRenderer}
            </List>
        </div>
    );
}
