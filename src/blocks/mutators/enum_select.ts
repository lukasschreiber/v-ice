import * as Blockly from 'blockly';
import { store } from '@/store/store';
import { subscribe } from '@/store/subscribe';
import types from "@/data/types"
import { FieldAutocompleteText } from '../fields/field_autocomplete_textinput';
import { BlockMutator } from '../block_mutators';
import { DataTable } from '@/data/table';

export interface EnumSelectBlock {
    variableType: string,
    updateDropdown_(): void,
    getDropDownOptions_(): string[],
}

interface EnumSelectState {
    variableType: string,
}


export class EnumSelectMutator extends BlockMutator<Blockly.Block & EnumSelectBlock, EnumSelectState> implements EnumSelectBlock {

    constructor() {
        super("enum_select_mutator")
    }

    @BlockMutator.mixin
    variableType: string = ""

    @BlockMutator.mixin
    updateDropdown_(this: Blockly.Block & EnumSelectBlock) {
        this.setOutput(true, this.variableType)
        const dropdown = this.getField("ENUM") as FieldAutocompleteText | null
        if (!dropdown) return

        dropdown.setAutoCompleteOptions(this.getDropDownOptions_())
    }

    @BlockMutator.mixin
    getDropDownOptions_(this: Blockly.Block & EnumSelectBlock) {
        const type = types.utils.fromString(this.variableType)
        if(!types.utils.isEnum(type)) return []

        // TODO: Do we really need the entire table here? Maybe we can cache the enum values in the store?
        const source = DataTable.fromNormalizedTable(store.getState().sourceTable)
        return [...new Set(types.registry.getEnumValues(type.enumName, source) || [])].sort()
    }

    public saveExtraState(this: Blockly.Block & EnumSelectBlock) {
        return {
            variableType: this.variableType,
        }
    }

    public loadExtraState(this: Blockly.Block & EnumSelectBlock, state: EnumSelectState) {
        this.variableType = state.variableType
        this.updateDropdown_()
    }

    public domToMutation(this: Blockly.Block & EnumSelectBlock, xmlElement: Element) {
        this.variableType = xmlElement.getAttribute("variableType")!

        subscribe(state => state.sourceTable, () => {
            this.updateDropdown_()
        }, {immediate: true})
    }

    public mutationToDom(this: Blockly.Block & EnumSelectBlock) {
        const mutation = Blockly.utils.xml.createElement("mutation")
        mutation.setAttribute("variableType", this.variableType)
        return mutation
    }
}
