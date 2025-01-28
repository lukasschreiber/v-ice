import { configureStore } from "@reduxjs/toolkit";
import { generatedCodeReducer } from "@/store/code/generated_code_slice"
import { settingsReducer } from "@/context/settings/settings_slice";
import { blocklyReducer } from "@/store/blockly/blockly_slice";
import { edgeCountReducer } from "./blockly/edge_count_slice";
import sourceTableReducer from "./data/source_table_slice";
import resultTableReducer from "./data/result_tables_slice";

export const store = configureStore({
    reducer: {
        generatedCode: generatedCodeReducer,
        sourceTable: sourceTableReducer,
        resultTables: resultTableReducer,
        settings: settingsReducer,
        blockly: blocklyReducer,
        edgeCounts: edgeCountReducer
    },
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch