import { createContext, useState } from "react";

interface IReactToolboxContext {
    pinnedBlocks: string[];
    setPinnedBlocks: (blocks: string[]) => void;
}

export const ReactToolboxContext = createContext<IReactToolboxContext>({
    pinnedBlocks: [],
    setPinnedBlocks: () => {}
});

export function ReactToolboxProvider(
    props: React.ComponentPropsWithoutRef<"div">
) {
    const [pinnedBlocks, setPinnedBlocks] = useState<string[]>([]);

    return (
        <ReactToolboxContext.Provider value={{ pinnedBlocks, setPinnedBlocks }}>
            {props.children}
        </ReactToolboxContext.Provider>
    );
}