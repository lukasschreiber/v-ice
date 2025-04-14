import { GenericBlockDefinition } from "@/toolbox/builder/definitions";
import { useLocalStorage } from "@v-ice/commons";
import { createContext, useCallback, useEffect } from "react";
import { toggleBlockPinned as reduxToggleBlockPinned, setPinnedBlocks as reduxSetPinnedBlocks } from "@/store/blockly/blockly_slice";
import { useDispatch, useSelector } from "@/store/hooks";
import { getToolboxBlockId } from "@/utils/ids";

interface IReactToolboxContext {
    isBlockPinned: (block?: GenericBlockDefinition) => boolean;
    toggleBlockPinned: (block?: GenericBlockDefinition) => void;
}

export const ReactToolboxContext = createContext<IReactToolboxContext>({
    isBlockPinned: () => false,
    toggleBlockPinned: () => {},
});

export function ReactToolboxProvider(props: React.ComponentPropsWithoutRef<"div">) {
    const [pinnedBlocks, setPinnedBlocks] = useLocalStorage<string[]>("v-ice-pinned", []);

    const { pinnedBlocks: reduxPinnedBlocks } = useSelector((state) => state.blockly);
    const dispatch = useDispatch();

    useEffect(() => {
        setPinnedBlocks(reduxPinnedBlocks.map((item) => item.hash));
    }, [reduxPinnedBlocks]);

    useEffect(() => {
        if (pinnedBlocks.length > 0) {
            dispatch(reduxSetPinnedBlocks(pinnedBlocks.map((item) => ({ hash: item }))));
        }
    }, [pinnedBlocks]);

    const isBlockPinned = useCallback(
        (block?: GenericBlockDefinition) => {
            if (!block) return false;
            return reduxPinnedBlocks.find(item => item.hash === getToolboxBlockId(block)) !== undefined;
        },
        [reduxPinnedBlocks]
    );

    const toggleBlockPinned = useCallback((block?: GenericBlockDefinition) => {
        if (!block) return;
        dispatch(reduxToggleBlockPinned(block));
    }, []);

    return (
        <ReactToolboxContext.Provider value={{ toggleBlockPinned, isBlockPinned }}>
            {props.children}
        </ReactToolboxContext.Provider>
    );
}
