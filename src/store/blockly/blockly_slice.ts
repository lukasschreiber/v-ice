import { GenericBlockDefinition } from "@/toolbox/builder/definitions";
import { IType } from "@/main";
import { getToolboxBlockId } from "@/utils/ids";
import { createSlice } from "@reduxjs/toolkit";

export type EdgeEditMarker = {
    sourceBlockId: string,
    sourceName: string,
    targetBlockId: string,
    targetName: string
}

export const blocklySlice = createSlice({
    name: "blockly",
    initialState: {
        edgeEditMarker: null as null | EdgeEditMarker,
        targetBlocks: {} as Record<string, string>,
        variables: [] as Array<{ name: string, type: IType, id: string }>,
        pinnedBlocks: [] as Array<{ hash: string }>,
        searchForm: {
            open: false,
            allowDragging: true,
            blockId: null as null | string,
            inputName: null as null | string,
            type: {} as IType,
            broaderType: null as null | IType,
        },
        loading: false,
        featuresReady: {
            toolbox: false,
            workspace: false,
            variables: false,
            persistedWorkspace: false,
        }
    },
    reducers: {
        setEdgeEditMarker: (state, action: { type: string, payload: EdgeEditMarker | null }) => {
            state.edgeEditMarker = action.payload
        },
        setTargetBlocks: (state, action) => {
            state.targetBlocks = action.payload
        },
        setVariables: (state, action) => {
            state.variables = action.payload
        },
        addVariable: (state, action: { type: string, payload: { name: string, type: IType, id: string } }) => {
            state.variables = [...state.variables, action.payload]
        },
        removeVariable: (state, action: { type: string, payload: string }) => {
            state.variables = state.variables.filter(variable => variable.id !== action.payload)
        },
        setFeatureReady: (state, action: { type: string, payload: keyof typeof state.featuresReady }) => {
            state.featuresReady = {
                ...state.featuresReady,
                [action.payload]: true
            }
            state.loading = Object.values(state.featuresReady).some(ready => !ready)
        },
        toggleBlockPinned: (state, action: { type: string, payload: GenericBlockDefinition }) => {
            const blockId = getToolboxBlockId(action.payload);
            const index = state.pinnedBlocks.findIndex(block => block.hash === blockId);
            if (index !== -1) {
                state.pinnedBlocks.splice(index, 1);
            } else {
                state.pinnedBlocks.push({ hash: blockId });
            }
        },
        setPinnedBlocks: (state, action: { type: string, payload: Array<{ hash: string }> }) => {
            state.pinnedBlocks = action.payload;
        },
        toggleSearchFormOpen: (state) => {
            state.searchForm.open = !state.searchForm.open;
            state.searchForm.type = {name: "*?", wildcard: true, primitive: false, nullable: true} as IType;
            state.searchForm.broaderType = null;
            state.searchForm.allowDragging = true;
            state.searchForm.blockId = null;
            state.searchForm.inputName = null;
        },
        closeSearchForm: (state) => {
            state.searchForm.open = false;
            state.searchForm.allowDragging = true;
            state.searchForm.blockId = null;
            state.searchForm.inputName = null;
        },
        openSearchForm: (state, action: {
            type: string, payload: {
                open: boolean,
                allowDragging: boolean,
                type: IType,
                broaderType: IType | null,
                blockId: null | string,
                inputName: null | string
            }
        }) => {
            state.searchForm = { ...action.payload }
        }
    }
})

export const { setTargetBlocks, setEdgeEditMarker, setVariables, setPinnedBlocks, addVariable, removeVariable, setFeatureReady, toggleBlockPinned, toggleSearchFormOpen, openSearchForm, closeSearchForm } = blocklySlice.actions
export const blocklyReducer = blocklySlice.reducer
