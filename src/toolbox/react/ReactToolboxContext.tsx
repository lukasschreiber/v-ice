import { GenericBlockDefinition, ToolboxDefinition } from "@/toolbox/builder/definitions";
import { useLocalStorage } from "@v-ice/commons";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
    toggleBlockPinned as reduxToggleBlockPinned,
    setPinnedBlocks as reduxSetPinnedBlocks,
} from "@/store/blockly/blockly_slice";
import { useDispatch, useSelector } from "@/store/hooks";
import { getToolboxBlockId } from "@/utils/ids";
import { useWorkspace } from "@/main";
import { evaluateIsHiddenFunc, getMetadataValue, hasIsHiddenFunc } from "../utils";
import { getBlockHeightWidth } from "@/renderer/block_metric_approximator";
import { getBlockTextFromBlockDefinition } from "@/utils/blocks";

type FlattenedToolboxCategoryEntry = {
    kind: "category";
    title: string;
    id: string;
    sortable: boolean;
    filterable: boolean;
};
type FlattenedToolboxBlockEntry = { kind: "block"; block: GenericBlockDefinition; noHighlight: boolean };
type FlattenedToolboxEmptyEntry = { kind: "empty" };
export type FlattenedToolboxEntry = FlattenedToolboxCategoryEntry | FlattenedToolboxBlockEntry | FlattenedToolboxEmptyEntry;

export const ToolboxPinnedContext = createContext<{
    isBlockPinned: (block?: GenericBlockDefinition) => boolean;
    toggleBlockPinned: (block?: GenericBlockDefinition) => void;
}>({
    isBlockPinned: () => false,
    toggleBlockPinned: () => {},
});

export const ToolboxLayoutContext = createContext<{
    getItemHeight: (index: number) => number;
    getItemSize: (index: number) => { width: number; height: number };
    getItem: (index: number) => any;
    itemCount: number;
    width: number;
}>({
    getItemHeight: () => 0,
    getItemSize: () => ({ width: 0, height: 0 }),
    getItem: () => null,
    itemCount: 0,
    width: 0,
});

export const ToolboxMetaContext = createContext<{
    getCategoryIndex: (categoryId: string) => number;
    padding: number;
    margin: number;
}>({
    getCategoryIndex: () => 0,
    padding: 6,
    margin: 4,
});

export const ToolboxUIContext = createContext<{
    searchTerm: string;
    getSearchTermForCategory: (categoryId: string) => string;
    setSearchTermForCategory: (categoryId: string, term: string) => void;
    setSearchTerm: (term: string) => void;
    getSortingDirectionForCategory: (categoryId: string) => "asc" | "desc";
    setSortingDirectionForCategory: (categoryId: string, direction: "asc" | "desc") => void;
}>({
    searchTerm: "",
    getSearchTermForCategory: () => "",
    setSearchTermForCategory: () => {},
    setSearchTerm: () => {},
    getSortingDirectionForCategory: () => "asc",
    setSortingDirectionForCategory: () => {},
});

const PADDING = 6;
const MARGIN = 4;

export function ReactToolboxProvider({
    children,
    definition,
}: {
    children: React.ReactNode;
    definition: ToolboxDefinition;
}) {
    const { workspace } = useWorkspace();
    const [pinnedBlocks, setPinnedBlocks] = useLocalStorage<{hash: string, block: GenericBlockDefinition}[]>("v-ice-pinned", []);
    const [searchTerm, setSearchTerm] = useState("");
    const [perCategorySearchTerm, setPerCategorySearchTerm] = useState<Record<string, string>>({});
    const [perCategorySortingDirection, setPerCategorySortingDirection] = useState<Record<string, "asc" | "desc">>({});
    const [initialized, setInitialized] = useState(false);
    const settings = useSelector((state) => state.settings.settings);

    const dispatch = useDispatch();

    const columns = useSelector((state) => state.sourceTable.columns);
    const variablesReady = useSelector((state) => state.blockly.featuresReady.variables);
    const variables = useSelector((state) => state.blockly.variables);
    const toolboxWidth = useSelector((state) => state.settings.settings.reactToolboxWidth);
    const scale = useSelector((state) => state.settings.settings.zoom);
    const { pinnedBlocks: reduxPinnedBlocks } = useSelector((state) => state.blockly);

    const flattenedToolbox: FlattenedToolboxEntry[] = useMemo(() => {
        if (!workspace || !variablesReady) return [];

        return definition.flatMap((category) => {
            if (hasIsHiddenFunc(category) && evaluateIsHiddenFunc(category, workspace, columns, settings)) return [];

            const blocks = category.kind === "static" ? category.blocks : category.instance.getBlocks(workspace);
            const noHighlight = getMetadataValue(category, "noHighlight") ?? false;

            const categoryEntry = [
                {
                    kind: "category",
                    title: category.name,
                    id: category.id,
                    sortable: getMetadataValue(category, "sortable") ?? false,
                    filterable: getMetadataValue(category, "filterable") ?? false,
                },
            ];

            const blockEntries = blocks
                .filter((block) => !(hasIsHiddenFunc(block) && evaluateIsHiddenFunc(block, workspace, columns, settings)))
                .map((block) => ({
                    kind: "block",
                    block,
                    noHighlight,
                }));

            return [...categoryEntry, ...blockEntries] as FlattenedToolboxEntry[];
        });
    }, [definition, workspace, columns, variablesReady, pinnedBlocks, variables, settings]);

    const getSearchTermForCategory = useCallback(
        (categoryId: string) => {
            return perCategorySearchTerm[categoryId] || "";
        },
        [perCategorySearchTerm]
    );

    const setSearchTermForCategory = useCallback((categoryId: string, term: string) => {
        setPerCategorySearchTerm((prev) => ({ ...prev, [categoryId]: term }));
    }, []);

    const getSortingDirectionForCategory = useCallback(
        (categoryId: string) => {
            return perCategorySortingDirection[categoryId] || "asc";
        },
        [perCategorySortingDirection]
    );

    const setSortingDirectionForCategory = useCallback((categoryId: string, direction: "asc" | "desc") => {
        setPerCategorySortingDirection((prev) => ({ ...prev, [categoryId]: direction }));
    }, []);

    const collator = useMemo(() => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }), []);

    const filteredToolbox = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase().trim();

        const result: FlattenedToolboxEntry[] = [];

        let currentCategory: FlattenedToolboxCategoryEntry | null = null;
        let collectedBlocks: FlattenedToolboxBlockEntry[] = [];

        const pushCategoryWithBlocks = () => {
            if (currentCategory) {
                // Sort blocks if the category is sortable
                if (currentCategory.sortable) {
                    const sortDirection = getSortingDirectionForCategory(currentCategory.id);
                    collectedBlocks.sort((a, b) => {
                        const aText = getBlockTextFromBlockDefinition(a.block);
                        const bText = getBlockTextFromBlockDefinition(b.block);
                        return sortDirection === "asc"
                            ? collator.compare(aText, bText)
                            : collator.compare(bText, aText);
                    });
                }
                result.push(currentCategory, ...collectedBlocks);
            } else {
                result.push(...collectedBlocks);
            }

            if (currentCategory && collectedBlocks.length === 0) {
                result.push({ kind: "empty" });
            }
        };

        for (const entry of flattenedToolbox) {
            if (entry.kind === "category") {
                // Push previous category + blocks
                pushCategoryWithBlocks();

                // Start new category
                currentCategory = entry;
                collectedBlocks = [];
            } else if (entry.kind === "block") {
                const matches = getBlockTextFromBlockDefinition(entry.block).toLowerCase().includes(lowerSearch);
                const categorySearchTerm = getSearchTermForCategory(currentCategory?.id || "")
                    .trim()
                    .toLowerCase();
                const categoryMatches = getBlockTextFromBlockDefinition(entry.block)
                    .toLowerCase()
                    .includes(categorySearchTerm);
                if (!currentCategory) {
                    // No active category → standalone block
                    if (matches) result.push(entry);
                } else if (!currentCategory.filterable) {
                    // Category not filterable → always include all blocks
                    collectedBlocks.push(entry);
                } else {
                    // Category is filterable → only include matching blocks
                    if ((!lowerSearch || matches) && (!categorySearchTerm || categoryMatches))
                        collectedBlocks.push(entry);
                }
            }
        }

        // Push the last batch
        pushCategoryWithBlocks();

        return result;
    }, [searchTerm, flattenedToolbox, getSearchTermForCategory, getSortingDirectionForCategory, collator]);

    const itemMetrics = useMemo(() => {
        return filteredToolbox.map((entry) => {
            if (entry.kind === "category") {
                return { width: 0, height: entry.filterable ? 60 : 25 };
            }

            if (entry.kind === "empty") {
                return { width: 0, height: 50 };
            }

            const metrics = getBlockHeightWidth(entry.block, scale);
            return {
                width: metrics.width,
                height: metrics.height + 2 * PADDING + 2 * MARGIN,
            };
        });
    }, [filteredToolbox, scale]);

    const getItem = useCallback((index: number) => filteredToolbox[index], [filteredToolbox]);
    const getItemSize = useCallback((index: number) => itemMetrics[index], [itemMetrics]);
    const getItemHeight = useCallback((index: number) => itemMetrics[index]?.height || 50, [itemMetrics]);

    const width = useMemo(() => {
        return Math.min(Math.max(...itemMetrics.map((m) => m.width + 40 || 0), toolboxWidth), toolboxWidth);
    }, [itemMetrics, toolboxWidth]);

    const getCategoryIndex = useCallback(
        (category: string) => {
            return filteredToolbox.findIndex((entry) => entry.kind === "category" && entry.id === category);
        },
        [filteredToolbox]
    );

    const isBlockPinned = useCallback(
        (block?: GenericBlockDefinition) => {
            if (!block) return false;
            return reduxPinnedBlocks.some((item) => item.hash === getToolboxBlockId(block));
        },
        [reduxPinnedBlocks]
    );

    const toggleBlockPinned = useCallback(
        (block?: GenericBlockDefinition) => {
            if (!block) return;
            dispatch(reduxToggleBlockPinned(block));
        },
        [dispatch]
    );

    useEffect(() => {
        setPinnedBlocks(reduxPinnedBlocks);
    }, [reduxPinnedBlocks]);

    useEffect(() => {
        if (!initialized && pinnedBlocks.length > 0) {
            dispatch(reduxSetPinnedBlocks(pinnedBlocks));
            setInitialized(true);
        }
    }, [initialized, pinnedBlocks]);

    return (
        <ToolboxPinnedContext.Provider value={{ isBlockPinned, toggleBlockPinned }}>
            <ToolboxUIContext.Provider
                value={{
                    searchTerm,
                    setSearchTerm,
                    getSearchTermForCategory,
                    setSearchTermForCategory,
                    getSortingDirectionForCategory,
                    setSortingDirectionForCategory,
                }}
            >
                <ToolboxLayoutContext.Provider
                    value={{
                        getItem,
                        getItemSize,
                        getItemHeight,
                        itemCount: filteredToolbox.length,
                        width: width,
                    }}
                >
                    <ToolboxMetaContext.Provider
                        value={{
                            getCategoryIndex,
                            padding: PADDING,
                            margin: MARGIN,
                        }}
                    >
                        {children}
                    </ToolboxMetaContext.Provider>
                </ToolboxLayoutContext.Provider>
            </ToolboxUIContext.Provider>
        </ToolboxPinnedContext.Provider>
    );
}
