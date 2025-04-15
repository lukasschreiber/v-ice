import { CSSProperties, memo } from "react";
import { FlattendToolboxEntry } from "./ReactToolbox";
import * as Blockly from "blockly/core";

export const ReactToolboxCategoryRow = memo(function ReactToolboxCategoryRow({
    item,
    style,
    searchTerm,
    onSearchTermChange,
}: {
    item: Extract<FlattendToolboxEntry, { kind: "category" }>;
    style: CSSProperties;
    searchTerm?: string;
    onSearchTermChange: (id: string, value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1 px-2" style={style}>
            <h3 className="text-sm text-gray-800" id={item.id}>
                {Blockly.utils.parsing.replaceMessageReferences(item.title)}
            </h3>
            {item.filterable && (
                <input
                    type="text"
                    className="w-full bg-gray-200"
                    placeholder="test"
                    value={searchTerm || ""}
                    onChange={(event) => onSearchTermChange(item.id, event.target.value)}
                />
            )}
        </div>
    );
});
