import * as Blockly from 'blockly';
import { FieldDynamicDropdown } from '@/blocks/fields/field_dynamic_dropdown';
import { store } from '@/store/store';
import { subscribe } from '@/store/subscribe';
import types from '@/data/types';
// import { TypeChecker } from '@/data/type_checker';
import { FieldTypeLabel } from '../fields/field_type_label';
import { Blocks } from '@/blocks';
import { BlockMutator } from '../block_mutators';

export interface ColumnSelectBlock {
    updateDropdown_(opt_updateOutputType?: boolean): void,
    getDropDownOptions_(): string[],
    columnTypeMap: Map<string, string>,
}

interface ColumnSelectState {
    column: string
    elementType: string
}

export class ColumnSelectMutator extends BlockMutator<Blockly.Block & ColumnSelectBlock, ColumnSelectState> implements ColumnSelectBlock {

    constructor() {
        super("column_select_mutator")
    }

    @BlockMutator.mixin
    columnTypeMap: Map<string, string> = new Map()

    @BlockMutator.mixin
    updateDropdown_(this: Blockly.Block & ColumnSelectBlock, opt_updateOutputType = true) {
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
    }

    @BlockMutator.mixin
    getDropDownOptions_(this: Blockly.Block & ColumnSelectBlock) {
        const sourceColumns = store.getState().sourceTable.columns
        const columnNames: string[] = []

        for (const column of sourceColumns) {
            columnNames.push(column.name)
            this.columnTypeMap.set(column.name, types.utils.toString(column.type))
        }

        return columnNames
    }

    public saveExtraState(this: Blockly.Block & ColumnSelectBlock) {
        if(this.getFieldValue("COLUMN") === "") this.updateDropdown_()
        
        return {
            column: this.getFieldValue("COLUMN"),
            elementType: this.columnTypeMap.get(this.getFieldValue("COLUMN"))!
        }
    }

    public loadExtraState(this: Blockly.Block & ColumnSelectBlock, state: ColumnSelectState) {
        const type = types.utils.fromString(state.elementType)
        this.setOutput(true, types.list(type).name)

        subscribe(state => state.sourceTable.columns, () => {
            this.updateDropdown_(false)
        }, { immediate: true })
    }

    public extension(this: Blockly.Block & ColumnSelectBlock): void {
        this.setOnChange((e) => {
            if (e.type === Blockly.Events.BLOCK_CHANGE) {
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
}
