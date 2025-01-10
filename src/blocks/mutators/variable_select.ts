import * as Blockly from "blockly/core"
import { FieldVariable } from "../fields/field_variable"
import types from "@/data/types"
import { FieldTypeLabel } from "../fields/field_type_label"
import { BlockMutator } from "../block_mutators"

interface VariableSelectState {
    variable: string
}

export class VariableSelectMutator extends BlockMutator<Blockly.Block, VariableSelectState> {

    constructor() {
        super("variable_select_mutator")
    }

    public saveExtraState(this: Blockly.Block): VariableSelectState {
        const variableField = this.getField("VAR") as FieldVariable
        return { variable: variableField.getVariable()!.type }
    }

    public loadExtraState(this: Blockly.Block, state: VariableSelectState) {
        const type = types.utils.fromString(state.variable)
        this.setOutput(true, type.name)

        const typeField = this.getField("TYPE") as FieldTypeLabel
        typeField.setType(type)
    }

    public extension(this: Blockly.Block): void {
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
}