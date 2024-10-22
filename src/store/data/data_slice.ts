import { SerializedTable } from "@/data/table";
import { createSlice } from "@reduxjs/toolkit";

export const dataSlice = createSlice({
    name: "query",
    initialState: {
        source: [] as SerializedTable,
        queryResults: {} as Record<string, SerializedTable>
    },
    reducers: {
        setQueryResults: (state, action) => {
            state.queryResults = action.payload
        },
        setSource: (state, action) => {
            state.source = action.payload
        }
    }
})

export const { setQueryResults, setSource } = dataSlice.actions
export const dataReducer = dataSlice.reducer
