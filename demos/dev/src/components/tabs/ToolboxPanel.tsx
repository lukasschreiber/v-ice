import { useCallback } from "react";
import {
    Blocks,
    Toolbox,
    ToolboxDefinition,
    getBlockDefinitionById,
    getBlockDefinitionNameById,
    useWorkspace,
} from "v-ice";

type CombinedCategory = {
    category: string;
    isDynamic: boolean;
    blocks: {
        name: string;
        block: any;
        color: string;
        textColor: string;
        isEditable?: boolean;
        extraLabel?: string;
        isHidden?: boolean;
    }[];
};

export function ToolboxPanel(props: {
    toolbox: ToolboxDefinition;
    setToolbox: React.Dispatch<React.SetStateAction<ToolboxDefinition>>;
}) {
    const { workspace } = useWorkspace();

    const getCombinedCategories = useCallback<() => CombinedCategory[]>(() => {
        return [
            ...Object.entries(Blocks).map(([category, blocks]) => ({
                category,
                isDynamic: false,
                blocks: Object.entries(blocks).map(([name, block]) => ({
                    name,
                    block,
                    color: getBlockColor(block),
                    textColor: category === "Node" ? "black" : "white",
                    isEditable: category !== "Node" && category !== "Variable",
                    // TODO: fix the types
                    // @ts-ignore
                    isHidden: !props.toolbox.contents.some(
                        (category: any) =>
                            !category.isHidden &&
                            category.contents?.some(
                                (item: any) => item.kind === "block" && item.type === block.id && !item.isHidden
                            )
                    ),
                })),
            })),
            ...Object.entries(Toolbox.Categories).map(([category, definition]) => ({
                category,
                isDynamic: true,
                blocks: new definition()
                    .getBlocks(workspace)
                    .map((_block) => {
                        const blockInfo = _block;
                        const block = getBlockDefinitionById(blockInfo.type) as string | undefined;
                        const name = getBlockDefinitionNameById(blockInfo.type) as string | undefined;
                        if (!block || !name) return null;
                        return {
                            name,
                            block,
                            color: getBlockColor(block),
                            textColor: category === "Nodes" ? "black" : "white",
                            isEditable: false,
                            extraLabel:
                                blockInfo.type === "variable_get"
                                    ? `🔗 ${blockInfo.fields?.["VAR"]?.["name"]}`
                                    : blockInfo.type === "target_node"
                                      ? `🔗 ${blockInfo.fields?.["LABEL"]?.["name"]}`
                                      : "",
                        };
                    })
                    .filter(Boolean) as {
                    name: string;
                    block: any;
                    color: string;
                    textColor: string;
                    extraLabel?: string;
                }[],
            })),
        ].sort((a, b) => a.category.localeCompare(b.category));
    }, [workspace, props.toolbox]);

    function getBlockColor(block: any) {
        return block.color || workspace?.getTheme().blockStyles[block.style]?.colourPrimary || "#e2e6eb";
    }

    function hexToTailwindRgba(hex: string) {
        const bigint = parseInt(hex.replace("#", ""), 16);
        return `rgba(${[(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255].join(",")}, var(--tw-bg-opacity))`;
    }

    return (
        <>
            <div className="flex flex-row gap-2 text-xs px-1 mb-4 mt-1 items-center">
                <p>Select a toolbox: </p>
                <select
                    className="bg-white rounded-sm border-slate-300 border border-solid"
                    value={
                        props.toolbox === Toolbox.Defaults.Default
                            ? "Default"
                              : "Empty"
                    }
                    onChange={(e) => {
                        // change the toolbox by hiding all blocks that are not part of the newly selected toolbox, if the toolbox is Complete just remount
                        if (e.target.value === "Default") {
                            props.setToolbox(Toolbox.Defaults.Default);
                        } else {
                            // find the difference between the Toolbox.Defaults.Complete and the new toolbox and hide all blocks that are not part of the new toolbox
                        }
                    }}
                >
                    <option value="Default">Default</option>
                    <option value="Empty">Empty</option>
                </select>
            </div>
            <div className="flex flex-col h-full px-1 pb-4">
                {workspace &&
                    getCombinedCategories().map(({ category, isDynamic, blocks }) => (
                        <div key={category} className="flex flex-col gap-2 pb-4">
                            <h2 className="text-xs font-semibold">
                                {category}
                                {isDynamic && " ⚡"}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {blocks.map(
                                    ({ name, block, isEditable, color, textColor, isHidden, extraLabel }, index) => (
                                        <div key={name + index} className="">
                                            <button
                                                className="disabled:opacity-50 enabled:hover:bg-opacity-90 bg-opacity-100 text-xs p-2 rounded"
                                                style={{ backgroundColor: hexToTailwindRgba(color), color: textColor }}
                                                onClick={() => {
                                                    props.setToolbox((old) => {
                                                        // toggle the isHidden attribute of the block
                                                        // TODO: fix the types
                                                        // @ts-ignore
                                                        const newContents = old.contents.map((category: any) => {
                                                            if (category.contents) {
                                                                category.contents = category.contents.map(
                                                                    (item: any) => {
                                                                        if (
                                                                            item.kind === "block" &&
                                                                            item.type === block.id
                                                                        ) {
                                                                            item.isHidden = !item.isHidden;
                                                                        }
                                                                        return item;
                                                                    }
                                                                );
                                                            }
                                                            return category;
                                                        });
                                                        // @ts-ignore
                                                        return { ...old, contents: newContents };
                                                    });
                                                }}
                                                disabled={!isEditable}
                                            >
                                                {name} {extraLabel && <span className="font-mono">{extraLabel}</span>}{" "}
                                                {isHidden && isEditable && "👻"}
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
            </div>
        </>
    );
}
