import { configureStore } from "@reduxjs/toolkit";
import { generatedCodeReducer } from "@/store/code/generated_code_slice"
import { dataReducer } from "@/store/data/data_slice";
import { settingsReducer } from "@/context/settings/settings_slice";
import { blocklyReducer } from "@/store/blockly/blockly_slice";
import { edgeCountReducer } from "./blockly/edge_count_slice";
import sourceTableReducer from "./data/source_table_slice";

export const store = configureStore({
    reducer: {
        generatedCode: generatedCodeReducer,
        data: dataReducer,
        sourceTable: sourceTableReducer,
        settings: settingsReducer,
        blockly: blocklyReducer,
        edgeCounts: edgeCountReducer
    },
    devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch