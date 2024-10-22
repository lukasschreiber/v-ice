import * as Blockly from "blockly/core"
import { FieldVariable } from "../fields/field_variable"
import types from "@/data/types"
import { FieldTypeLabel } from "../fields/field_type_label"

interface IVariableSelectState {
    variable: string
}

Blockly.Extensions.registerMutator(
    "variable_select_mutator",
    {
        saveExtraState: function (this: Blockly.Block): IVariableSelectState {
            const variableField = this.getField("VAR") as FieldVariable
            return { variable: variableField.getVariable()!.type }
        },
        loadExtraState: function (this: Blockly.Block, state: IVariableSelectState) {
            const type = types.utils.fromString(state.variable)
            this.setOutput(true, type.name)

            const typeField = this.getField("TYPE") as FieldTypeLabel
            typeField.setType(type)
        },
    },
    function (this: Blockly.Block) {
        const variableField = this.getField("VAR") as FieldVariable
        const typeField = this.getField("TYPE") as FieldTypeLabel
        const typeCheck = typeField.getType()?.name
        
        if (typeCheck) {
            this.setOutput(true, typeCheck)
        }

        variableField.setOnValueChange(() => {
            const typeString = variableField.getVariable()?.type
            if (typeString) {
                const type = types.utils.fromString(typeString)
                this.setOutput(true, type.name)

                const typeField = this.getField("TYPE") as FieldTypeLabel
                typeField.setType(type)
            }
        })
    }
)