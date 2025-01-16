import { Blocks } from '@/blocks';
import * as Blockly from 'blockly/core';
import { TypedField } from './field';
import types from '@/data/types';

export class FieldDynamicDropdown extends Blockly.FieldDropdown implements TypedField {
    private editorOpen: boolean = false

    updateOptions(menuGenerator: Blockly.MenuGenerator) {
        this.updateOptions_(menuGenerator)
    }

    protected updateOptions_(menuGenerator: Blockly.MenuGenerator) {
        this.menuGenerator_ = menuGenerator
        const options = this.getOptions()
        if (!options.find(it => it[1] === this.value_)) {
            this.setValue(options[0][1])
        }

        if (this.editorOpen) {
            this.dropdownDispose_()
            this.showEditor_()
        }
    }

    getOutputType() {
        return types.string
    }

    protected shouldAddBorderRect_(): boolean {
        if (this.sourceBlock_?.type === Blocks.Names.ENUM.SELECT || this.sourceBlock_?.type === Blocks.Names.VARIABLE.GET_COLUMN || this.sourceBlock_?.type === Blocks.Names.TIMELINE.EVENT_PICKER) {
            return false
        }
        return super.shouldAddBorderRect_()
    }

    protected override showEditor_(e?: MouseEvent | undefined): void {
        super.showEditor_(e)
        this.editorOpen = true
    }

    protected override dropdownDispose_(): void {
        super.dropdownDispose_()
        this.editorOpen = false
    }
}

Blockly.fieldRegistry.register('field_dynamic_dropdown', FieldDynamicDropdown);