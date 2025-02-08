import { NormalizedFitleredDataTable } from "@/data/filtered_table";
import { createSlice } from "@reduxjs/toolkit";

const resultTableSlice = createSlice({
    name: "result-tables",
    initialState: {} as Record<string, NormalizedFitleredDataTable>,
    reducers: {
        setResultTable: (state, action: { payload: { name: string, table: NormalizedFitleredDataTable } }) => {
            state = {
                ...state,
                [action.payload.name]: action.payload.table
            };
        },
        setResultTables: (state, action: { payload: Record<string, NormalizedFitleredDataTable> }) => {
            Object.keys(action.payload).forEach((key) => {
                state[key] = action.payload[key];
            });
        },
        removeResultTable: (state, action: { payload: string }) => {
            delete state[action.payload];
        }
    }
});

export const { setResultTable, removeResultTable, setResultTables } = resultTableSlice.actions;
export default resultTableSlice.reducer;