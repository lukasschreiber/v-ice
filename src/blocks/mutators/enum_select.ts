import * as Blockly from 'blockly';
import { store } from '@/store/store';
import { subscribe } from '@/store/subscribe';
import types from "@/data/types"
import { FieldAutocompleteText } from '../fields/field_autocomplete_textinput';

export interface EnumSelectBlock extends Blockly.Block {
    variableType: string,
    updateDropdown_(): void,
    getDropDownOptions_(): string[],
}

interface EnumSelectState {
    variableType: string,
}

const enumSelectMixin: Partial<EnumSelectBlock> = {
    saveExtraState: function (this: EnumSelectBlock) {
        return {
            variableType: this.variableType,
        }
    },
    loadExtraState: function (this: EnumSelectBlock, state: EnumSelectState) {
        this.variableType = state.variableType
        this.updateDropdown_()
    },
    domToMutation: function (this: EnumSelectBlock, xmlElement: Element) {
        this.variableType = xmlElement.getAttribute("variableType")!

        subscribe(state => state.data.source, () => {
            this.updateDropdown_()
        }, {immediate: true})
    },
    mutationToDom: function (this: EnumSelectBlock) {
        const mutation = Blockly.utils.xml.createElement("mutation")
        mutation.setAttribute("variableType", this.variableType)
        return mutation
    },
    updateDropdown_: function (this: EnumSelectBlock) {
        this.setOutput(true, this.variableType)
        const dropdown = this.getField("ENUM") as FieldAutocompleteText | null
        if (!dropdown) return

        dropdown.setAutoCompleteOptions(this.getDropDownOptions_())
    },
    getDropDownOptions_: function (this: EnumSelectBlock) {
        const type = types.utils.fromString(this.variableType)
        if(!types.utils.isEnum(type)) return []

        const source = store.getState().data.source
        return [...new Set(types.registry.getEnumValues(type.enumName, source) || [])].sort()
    }
}

Blockly.Extensions.registerMutator(
    'enum_select_mutator',
    enumSelectMixin,
);

