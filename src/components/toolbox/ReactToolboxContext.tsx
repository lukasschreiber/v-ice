import { GenericBlockDefinition } from "@/blocks/toolbox/builder/definitions";
import { hashString } from "@/utils/hash";
import { createContext, useCallback, useState } from "react";

interface IReactToolboxContext {
    isBlockPinned: (block?: GenericBlockDefinition) => boolean;
    toggleBlockPinned: (block?: GenericBlockDefinition) => void;
}

export const ReactToolboxContext = createContext<IReactToolboxContext>({
    isBlockPinned: () => false,
    toggleBlockPinned: () => { }
});

export function ReactToolboxProvider(
    props: React.ComponentPropsWithoutRef<"div">
) {
    const [pinnedBlocks, setPinnedBlocks] = useState<string[]>([]);

    function getToolboxBlockId(block: GenericBlockDefinition) {
        return hashString(block, (hash) => "toolbox-" + hash);
    }

    const isBlockPinned = useCallback((block?: GenericBlockDefinition) => {
        if (!block) return false;
        return pinnedBlocks.includes(getToolboxBlockId(block));
    }, [pinnedBlocks]);
    const toggleBlockPinned = useCallback((block?: GenericBlockDefinition) => {
        if (!block) return;
        console.log("toggleBlockPinned", block.type);
        setPinnedBlocks((blocks) => {
            const id = getToolboxBlockId(block);
            if (blocks.includes(id)) {
                return blocks.filter((b) => b !== id);
            } else {
                return [...blocks, id];
            }
        });
    }, []);

    return (
        <ReactToolboxContext.Provider value={{ toggleBlockPinned, isBlockPinned }}>
            {props.children}
        </ReactToolboxContext.Provider>
    );
}