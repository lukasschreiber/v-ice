import { IType, ValueOf } from '@/data/types';
import { ColumnType, DataTable } from '@/data/table';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from "reselect";
import { RootState } from '../store';

export interface NormalizedDataTable {
    columns: {name: string, type: IType}[];
    rows: Record<string, ValueOf<ColumnType>>[];
    index: number[];
}

const sourceTableSlice = createSlice({
    name: "data-table",
    initialState: {
        columns: [],
        rows: [],
        index: []
    } as NormalizedDataTable,
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
        }
    }
});

export const { addSourceColumn, addSourceRow, updateSourceCell, removeSourceRow, setSourceTable } = sourceTableSlice.actions;
export default sourceTableSlice.reducer;

const selectSourceTable = (state: RootState) => state.sourceTable;

// Memoized selector to create a DataTable from the normalized table
export const selectDataTable = createSelector(
  [selectSourceTable], // Input selector
  (sourceTable) => DataTable.fromNormalizedTable(sourceTable) // Output transformation
);