import * as Blockly from 'blockly';
import { FieldDynamicDropdown } from '@/blocks/fields/field_dynamic_dropdown';
import { store } from '@/store/store';
import { subscribe } from '@/store/subscribe';
import types from '@/data/types';
import { BlockMutator } from '../block_mutators';

export interface HasVariableBlock {
    updateDropdown_(opt_updateOutputType?: boolean): void,
    getDropDownOptions_(): string[],
    columnTypeMap: Map<string, string>,
}

interface HasVariableState {
    column: string
}

export class HasVariableMutator extends BlockMutator<Blockly.Block & HasVariableBlock, HasVariableState> implements HasVariableBlock {

    constructor() {
        super("has_variable_mutator")
    }

    @BlockMutator.mixin
    columnTypeMap: Map<string, string> = new Map()

    @BlockMutator.mixin
    updateDropdown_(this: Blockly.Block & HasVariableBlock) {
        const dropdown = this.getField("VAR") as FieldDynamicDropdown | null
        if (!dropdown) return

        dropdown.updateOptions(
            () => {
                const options: string[] = this.getDropDownOptions_()
                return options.length >= 1 ? options.map(it => [it, it]) : [["", ""]];
            }
        )
    }

    @BlockMutator.mixin
    getDropDownOptions_(this: Blockly.Block & HasVariableBlock) {
        const sourceColumns = store.getState().sourceTable.columns
        const columnNames: string[] = []

        for (const column of sourceColumns) {
            const type = types.utils.toString(column.type)
            if (types.utils.isNullable(column.type)) {
                columnNames.push(column.name)
            }
            this.columnTypeMap.set(column.name, type)
        }

        return columnNames
    }

    public saveExtraState(this: Blockly.Block & HasVariableBlock) {
        if(this.getFieldValue("VAR") === "") this.updateDropdown_()
        
        return {
            column: this.getFieldValue("VAR"),
        }
    }

    public loadExtraState(this: Blockly.Block & HasVariableBlock, _: HasVariableState) {
        subscribe(state => state.sourceTable.columns, () => {
            this.updateDropdown_(false)
        }, { immediate: true })
    }

    public extension(this: Blockly.Block & HasVariableBlock): void {
        this.setOnChange((e) => {
            if (e.type === Blockly.Events.BLOCK_CHANGE) {
                const payload = e.toJson() as Blockly.Events.BlockChangeJson
                if (payload.name === "VAR") {
                    const type = this.columnTypeMap.get(payload.newValue as string)
                    if (type) {
                        this.updateDropdown_()
                    }
                }
            }
        })
    }
}
