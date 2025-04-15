import { IType } from "@/main";
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
        }
    }
})

export const { setTargetBlocks, setEdgeEditMarker, setVariables, addVariable, removeVariable, setFeatureReady } = blocklySlice.actions
export const blocklyReducer = blocklySlice.reducer
