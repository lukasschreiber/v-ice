import { createSlice } from "@reduxjs/toolkit";
import { getDefaultSettings } from "@/context/settings/settings";
import { getSettingsDefinition } from "@/context/settings/settings_definition";

export const settingsSlice = createSlice({
    name: "settings",
    initialState: {
        settings: getDefaultSettings(getSettingsDefinition())
    },
    reducers: {
        setSettings: (state, action) => {
            state.settings = action.payload
        }
    }
})

export const { setSettings } = settingsSlice.actions
export const settingsReducer = settingsSlice.reducer
