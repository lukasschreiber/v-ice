import { TypeChecker } from "@/data/type_checker";
import types from "@/data/types";
import { DataTable, useWorkspace } from "@/main";
import { getBlockHeightWidth } from "@/renderer/block_metric_approximator";
import { useSelector } from "@/store/hooks";
import { Variables } from "@/toolbox/categories/variables";
import { ReactToolboxBlockRow } from "@/toolbox/react/ReactToolboxBlockRow";
import { getBlockTextFromBlockDefinition } from "@/utils/blocks";
import { Layer } from "@/utils/zindex";
import { CSSProperties, useCallback, useMemo, useRef, useState } from "react";
import { VariableSizeList } from "react-window";
import { TypeIconPreview } from "./common/TypeIconPreview";
import * as Blockly from "blockly/core";
import { blockDefinitionToBlockState } from "@/toolbox/utils";
import InfoIcon from "@/assets/InfoIcon.svg?react";
import { Blocks } from "@/blocks";
import { useLocalStorage } from "@v-ice/commons";
import { Tooltip } from "./common/Tooltip";

export function SearchForm(props: { onClose: () => void }) {
    const listRef = useRef<VariableSizeList>(null);
    const { workspace } = useWorkspace();
    const scale = useSelector((state) => state.settings.settings.zoom);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const sourceTable = useSelector((state) => state.sourceTable);
    const [onlyUseExactType, setOnlyUseExactType] = useLocalStorage("onlyUseExactType", true);
    const overscanCount = useSelector((state) => state.settings.settings.reactToolboxOverscan);
    const type = useSelector((state) => state.blockly.searchForm.type);
    const broaderType = useSelector((state) => state.blockly.searchForm.broaderType);
    const allowDragging = useSelector((state) => state.blockly.searchForm.allowDragging);
    const blockId = useSelector((state) => state.blockly.searchForm.blockId);
    const inputName = useSelector((state) => state.blockly.searchForm.inputName);

    const PADDING = 6;
    const MARGIN = 4;
    const MAX_HEIGHT = 500;

    const variableBlocks = useMemo(() => {
        const blocks = new Variables().getBlocks(workspace).filter((block) => {
            if (block.type !== "variable_get") return false;
            if (block.fields?.["VAR"] === undefined) return false;
            const currentType = types.utils.fromString(block.fields["VAR"].type as string);
            if (
                TypeChecker.checkTypeCompatibility(onlyUseExactType ? type : (broaderType ?? type), currentType) ===
                false
            )
                return false;

            if (getBlockTextFromBlockDefinition(block).toLowerCase().includes(searchTerm.toLowerCase())) {
                return true;
            }

            return false;
        });
        return blocks;
    }, [workspace, searchTerm, onlyUseExactType, type, broaderType]);

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

    const totalHeight = useMemo(() => {
        return Math.min(
            variableBlocks.reduce((sum, _, i) => sum + getItemSize(i), 0),
            MAX_HEIGHT
        );
    }, [variableBlocks, getItemSize]);

    const handleItemClick = useCallback(
        (index: number) => {
            const block = variableBlocks[index];
            if (allowDragging) return;

            if (blockId && inputName) {
                const parentBlock = workspace.getBlockById(blockId);
                if (!parentBlock) return;

                const connection = parentBlock.getInput(inputName)?.connection;

                if (connection) {
                    const oldBlock = connection.targetBlock();
                    if (oldBlock) {
                        connection.disconnect();
                        oldBlock.dispose();
                    }
                }

                const newBlock = Blockly.serialization.blocks.append(blockDefinitionToBlockState(block), workspace);

                if (Blocks.Types.isDynamicInputBlock(parentBlock)) {
                    parentBlock.setType(
                        inputName,
                        types.utils.fromString(newBlock.outputConnection?.getCheck()?.[0] ?? ""),
                        false
                    );
                }

                connection?.connect(newBlock.outputConnection!);
            }

            props.onClose();
        },
        [allowDragging, variableBlocks, blockId, inputName, props.onClose, workspace]
    );

    const handleInfoClick = useCallback(
        (event: React.MouseEvent, _index: number) => {
            event.stopPropagation();
            event.preventDefault();
        },
        [variableBlocks]
    );

    const rowRenderer = useCallback(
        ({ index, style }: { index: number; style: CSSProperties }) => {
            const block = variableBlocks[index];

            const metrics = itemMetrics[index];
            return (
                <div
                    style={style}
                    onClick={() => handleItemClick(index)}
                    className={`w-full hover:bg-gray-100 rounded-md flex items-center justify-between pr-2 ${allowDragging ? "" : "cursor-pointer"}`}
                >
                    <ReactToolboxBlockRow
                        block={block}
                        width={metrics.width}
                        height={metrics.height - 2 * PADDING - 2 * MARGIN}
                        padding={PADDING}
                        noHighlight
                        noFavorite
                        noInteraction={!allowDragging}
                    />
                    <div className="flex items-center gap-2">
                        <Tooltip
                            text={(() => {
                                const variableField = block.fields?.["VAR"];
                                if (!variableField) return null;
                                const type = types.utils.fromString(variableField.type as string);
                                const name = variableField.name as string;
                                return (
                                    <div className="flex flex-col gap-1 text-xs p-1">
                                        <div className="flex">
                                            <div className="w-24 font-semibold text-gray-700">Variable Name:</div>
                                            <div className="text-gray-600">{name}</div>
                                        </div>
                                        <div className="flex">
                                            <div className="w-24 font-semibold text-gray-700">Variable Type:</div>
                                            <div className="text-gray-600 max-w-[200px]">
                                                {types.utils.describe(type)}
                                            </div>
                                        </div>
                                        <div className="flex">
                                            <div className="w-24 font-semibold text-gray-700">Examples:</div>
                                            <div className="text-gray-600 max-w-[200px]">
                                                {types.utils
                                                    .examplesForColumn(
                                                        name,
                                                        DataTable.fromNormalizedTable(sourceTable),
                                                        3
                                                    )
                                                    .join(", ")}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            position="right"
                            className="text-text"
                        >
                            <div
                                className="rounded-md hover:bg-gray-200 p-1 flex items-center justify-center cursor-pointer"
                                onClick={(e) => handleInfoClick(e, index)}
                            >
                                <InfoIcon className="w-5 h-5 text-gray-500" />
                            </div>
                        </Tooltip>
                    </div>
                </div>
            );
        },
        [variableBlocks, itemMetrics]
    );

    return (
        <div
            className="absolute top-0 left-0 right-0 bottom-0 backdrop-blur-md flex justify-center"
            style={{ zIndex: Layer.SearchOverlay }}
            onClick={props.onClose}
        >
            <div
                className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center justify-between w-fit h-fit mt-10"
                onClick={(e) => e.stopPropagation()}
            >
                <input
                    autoFocus
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search"
                    className="border border-gray-300 p-2 rounded-lg outline-none w-full mb-2"
                />
                {broaderType && broaderType.name !== type?.name && (
                    <div className="text-gray-500 text-sm flex items-center gap-3 mb-2 justify-start w-full">
                        <label className="flex items-center gap-1">
                            <input
                                type="radio"
                                checked={onlyUseExactType}
                                name="type"
                                onChange={() => setOnlyUseExactType((old) => !old)}
                            />{" "}
                            Exact Type <TypeIconPreview type={type.name} />
                        </label>
                        <label className="flex items-center gap-1">
                            <input
                                type="radio"
                                checked={!onlyUseExactType}
                                name="type"
                                onChange={() => setOnlyUseExactType((old) => !old)}
                            />{" "}
                            All Matching Types <TypeIconPreview type={broaderType.name} />
                        </label>
                    </div>
                )}
                <div>
                    {variableBlocks.length === 0 && (
                        <div className="text-gray-500 text-sm flex items-center gap-1">
                            No variables found
                            {type && (
                                <>
                                    {" "}
                                    that match the type <TypeIconPreview type={type.name} />
                                </>
                            )}
                            {searchTerm && type && " and the search term"}
                        </div>
                    )}
                    <VariableSizeList
                        ref={listRef}
                        height={totalHeight}
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
