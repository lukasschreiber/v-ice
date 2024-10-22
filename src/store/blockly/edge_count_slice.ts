import { createSlice } from "@reduxjs/toolkit";

export const edgeCountSlice = createSlice({
    name: "edgeCounts",
    initialState: {
        counts: {} as Record<string, number>,
    },
    reducers: {
        setEdgeCounts: (state, action: {type: string, payload: Record<string, number>}) => {
            state.counts = action.payload
        },
    }
})

export const { setEdgeCounts } = edgeCountSlice.actions
export const edgeCountReducer = edgeCountSlice.reducer
