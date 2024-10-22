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
        targetBlocks: {} as Record<string, string>
    },
    reducers: {
        setEdgeEditMarker: (state, action: {type: string, payload: EdgeEditMarker | null}) => {
            state.edgeEditMarker = action.payload
        },
        setTargetBlocks: (state, action) => {
            state.targetBlocks = action.payload
        },
    }
})

export const { setTargetBlocks, setEdgeEditMarker } = blocklySlice.actions
export const blocklyReducer = blocklySlice.reducer
