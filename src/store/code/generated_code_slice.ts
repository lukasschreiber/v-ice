import { createSlice } from "@reduxjs/toolkit";

export const generatedCodeSlice = createSlice({
    name: "generated-code",
    initialState: {
        json: "",
        xml: "",
        code: ""
    },
    reducers: {
        setCode: (state, action) => {
            if(state.code !== action.payload)
                state.code = action.payload
        },
        setJson: (state, action) => {
            state.json = action.payload
        },
        setXml: (state, action) => {
            state.xml = action.payload
        }
    }
})

export const { setCode, setJson, setXml } = generatedCodeSlice.actions
export const generatedCodeReducer = generatedCodeSlice.reducer
