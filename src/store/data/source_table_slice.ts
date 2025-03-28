import { IType } from '@/data/types';
import { DataTable, NormalizedDataTable } from '@/data/table';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from "reselect";
import { RootState } from '../store';

const sourceTableSlice = createSlice({
    name: "data-table",
    initialState: {
        columns: [],
        rows: [],
        index: [],
        initialized: false
    } as NormalizedDataTable & { initialized: boolean },
    reducers: {
        addSourceColumn: (state, action: PayloadAction<{name: string, type: IType}>) => {
            state.columns.push(action.payload);
        },
        addSourceRow: (state, action: PayloadAction<Record<string, any[]>>) => {
            const newIndex = state.index.length > 0 ? Math.max(...state.index) + 1 : 0;
            state.rows[newIndex] = action.payload;
            state.index.push(newIndex);
        },
        updateSourceCell: (state, action: PayloadAction<{ rowIndex: number; columnName: string; value: any }>) => {
            const { rowIndex, columnName, value } = action.payload;
            if (state.rows[rowIndex]) {
                state.rows[rowIndex][columnName] = value;
            }
        },
        removeSourceRow: (state, action: PayloadAction<number>) => {
            const rowIndex = action.payload;
            delete state.rows[rowIndex];
            state.index = state.index.filter((index) => index !== rowIndex);
        },
        setSourceTable: (state, action: PayloadAction<NormalizedDataTable>) => {
            const { columns, index, rows } = action.payload;
            state.columns = columns;
            state.index = index;
            state.rows = rows;
            state.initialized = true;
        },
        setInitialized: (state, action: PayloadAction<boolean>) => {
            state.initialized = action.payload;
        }
    }
});

export const { addSourceColumn, addSourceRow, updateSourceCell, removeSourceRow, setSourceTable, setInitialized } = sourceTableSlice.actions;
export default sourceTableSlice.reducer;

const selectRawSourceTable = (state: RootState) => state.sourceTable;

export const selectSourceDataTable = createSelector(
  [selectRawSourceTable],
  (sourceTable) => DataTable.fromNormalizedTable(sourceTable)
);