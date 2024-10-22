import * as Blockly from 'blockly';
import { FieldDynamicDropdown } from '@/blocks/fields/field_dynamic_dropdown';
import { store } from '@/store/store';
import { subscribe } from '@/store/subscribe';
import { DataTable } from '@/data/table';
import types from '@/data/types';
// import { TypeChecker } from '@/data/type_checker';
import { FieldTypeLabel } from '../fields/field_type_label';
import { Blocks } from '@/blocks';

export interface ColumnSelectBlock extends Blockly.Block {
    updateDropdown_(opt_updateOutputType?: boolean): void,
    getDropDownOptions_(): string[],
    columnTypeMap: Map<string, string>,
}

interface ColumnSelectBlockState {
    column: string
    elementType: string
}

const columnSelectMixin: Partial<ColumnSelectBlock> = {
    columnTypeMap: new Map(),
    saveExtraState: function (this: ColumnSelectBlock): ColumnSelectBlockState {
        if(this.getFieldValue("COLUMN") === "") this.updateDropdown_()
        
        return {
            column: this.getFieldValue("COLUMN"),
            elementType: this.columnTypeMap.get(this.getFieldValue("COLUMN"))!
        }
    },
    loadExtraState: function (this: ColumnSelectBlock, state: ColumnSelectBlockState) {
        const type = types.utils.fromString(state.elementType)
        this.setOutput(true, types.list(type).name)

        subscribe(state => state.data.source, () => {
            this.updateDropdown_(false)
        }, { immediate: true })
    },
    updateDropdown_: function (this: ColumnSelectBlock, opt_updateOutputType = true) {
        const dropdown = this.getField("COLUMN") as FieldDynamicDropdown | null
        if (!dropdown) return

        dropdown.updateOptions(
            () => {
                const options: string[] = this.getDropDownOptions_()
                const typeString = this.columnTypeMap.get(this.getFieldValue("COLUMN")) ?? this.columnTypeMap.get(options[0])
                if (typeString) {
                    const type = types.utils.fromString(typeString)
                    if(opt_updateOutputType) {
                        if (this.outputConnection?.isConnected()) {
                            const parent = this.outputConnection?.targetBlock()
                            const parentInput = this.outputConnection?.targetConnection?.getParentInput()
                            if (parent && parentInput && Blocks.Types.isDynamicInputBlock(parent)) {
                                parent.setType(parentInput.name, types.list(type), true)
                            }
                        } else {
                            this.setOutput(true, types.list(type).name)
                        }
                    }
                    const typeLabel = this.getField("TYPE") as FieldTypeLabel
                    typeLabel.setType(types.list(type))
                }
                return options.length >= 1 ? options.map(it => [it, it]) : [["", ""]];
            }
        )
    },
    getDropDownOptions_: function (this: ColumnSelectBlock) {
        const source = store.getState().data.source
        const columnNames: string[] = []

        for (const column of source) {
            if (column.name === DataTable.indexColumnName_) continue
            columnNames.push(column.name)
            this.columnTypeMap.set(column.name, column.type)
        }

        return columnNames
    },
}

const columnSelectExtension = function (this: ColumnSelectBlock) {
    this.setOnChange((e) => {
        if (e.type === Blockly.Events.CHANGE) {
            const payload = e.toJson() as Blockly.Events.BlockChangeJson
            if (payload.name === "COLUMN") {
                const type = this.columnTypeMap.get(payload.newValue as string)
                if (type) {
                    this.updateDropdown_()
                }
            }
        }
    })
}


Blockly.Extensions.registerMutator(
    'column_select_mutator',
    columnSelectMixin,
    columnSelectExtension,
);

