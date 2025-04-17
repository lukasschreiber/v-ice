import { CSSProperties, memo, useContext } from "react";
import * as Blockly from "blockly/core";
import { FlattenedToolboxEntry, ToolboxUIContext } from "./ReactToolboxContext";

export const ReactToolboxCategoryRow = memo(function ReactToolboxCategoryRow({
    item,
    style,
}: {
    item: Extract<FlattenedToolboxEntry, { kind: "category" }>;
    style: CSSProperties;
}) {
    const { getSearchTermForCategory, setSearchTermForCategory, getSortingDirectionForCategory, setSortingDirectionForCategory } = useContext(ToolboxUIContext)
    return (
        <div className="flex flex-col gap-1 px-2" style={style}>
            <h3 className="text-sm text-gray-800" id={item.id}>
                {Blockly.utils.parsing.replaceMessageReferences(item.title)}
                {item.sortable && (
                    <span className="text-xs text-gray-500 cursor-pointer" onClick={() => {
                        setSortingDirectionForCategory(item.id, getSortingDirectionForCategory(item.id) === "asc" ? "desc" : "asc");
                    }}>
                        {getSortingDirectionForCategory(item.id) === "asc" ? " (A-Z)" : " (Z-A)"}
                    </span>
                )}
            </h3>
            {item.filterable && (
                <input
                    type="text"
                    className="w-full p-0.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-blue-500 focus:ring-1 text-sm"
                    placeholder="Search..."
                    value={getSearchTermForCategory(item.id) ?? ""}
                    onChange={(event) => {
                        const value = event.target.value;
                        setSearchTermForCategory(item.id, value);
                    }}
                />
            )}
        </div>
    );
});
