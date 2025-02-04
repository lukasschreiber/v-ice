import { createSlice } from "@reduxjs/toolkit";
import { getDefaultSettings } from "@/context/settings/settings";
import { getSettingsDefinition } from "@/context/settings/settings_definition";

export const settingsSlice = createSlice({
    name: "settings",
    initialState: {
        settings: getDefaultSettings(getSettingsDefinition()),
        debugger: {
            code: false,
            ast: false,
            blocklyJson: false,
            blocklyXml: false,
        }
    },
    reducers: {
        setSettings: (state, action) => {
            state.settings = action.payload
        },
        setDebugger: (state, action) => {
            state.debugger.ast = action.payload.ast
            state.debugger.blocklyJson = action.payload.blocklyJson
            state.debugger.blocklyXml = action.payload.blocklyXml
            state.debugger.code = action.payload.code
        }
    }
})

export const { setSettings, setDebugger } = settingsSlice.actions
export const settingsReducer = settingsSlice.reducer
