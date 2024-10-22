import * as Blockly from 'blockly';
import { FieldDynamicDropdown } from '@/blocks/fields/field_dynamic_dropdown';
import { store } from '@/store/store';
import { subscribe } from '@/store/subscribe';
import types, { IEventType, StructFields, ValueOf } from "@/data/types"
import { ColumnType, SerializedColumn } from '@/data/table';
import { TypeChecker } from '@/data/type_checker';

export interface EventSelectBlock extends Blockly.Block {
    column: string,
    updateDropdown_(): void,
    getDropDownOptions_(): string[],
}

interface EventSelectState {
    column: string,
}

const eventSelectMixin: Partial<EventSelectBlock> = {
    saveExtraState: function (this: EventSelectBlock): EventSelectState {
        return {
            column: this.column,
        }
    },
    loadExtraState: function (this: EventSelectBlock, state: EventSelectState) {
        this.column = state.column
        this.updateDropdown_()
    },
    domToMutation: function (this: EventSelectBlock, xmlElement: Element) {
        this.column = xmlElement.getAttribute("column")!
        subscribe(state => state.data.source, () => {
            this.updateDropdown_()
        }, {immediate: true})
    },
    mutationToDom: function (this: EventSelectBlock) {
        const mutation = Blockly.utils.xml.createElement("mutation")
        mutation.setAttribute("column", this.column)
        return mutation
    },
    updateDropdown_: function (this: EventSelectBlock) {
        const dropdown = this.getField("EVENT") as FieldDynamicDropdown | null
        if (!dropdown) return
        dropdown.updateOptions(
            () => {
                const options: [string, string][] = this.getDropDownOptions_().map(it => [it, it]);
                return options.length >= 1 ? options : [["", ""]];
            }
        )
    },
    getDropDownOptions_: function (this: EventSelectBlock) {
        const source = store.getState().data.source
        const column = source.find(column => column.name === this.column) as SerializedColumn<ColumnType> | undefined
        const events = (column?.values.filter(timeline => Array.isArray(timeline)).flatMap(timeline => (timeline as unknown[]).filter(event => event && TypeChecker.checkType(types.event(types.enum(types.wildcard)), event))) ?? []) as ValueOf<IEventType<StructFields>>[]
        return [...new Set(events.map(event => event.type))].filter(type => type !== null)
    }
}

Blockly.Extensions.registerMutator(
    'event_select_mutator',
    eventSelectMixin,
    () => {},
);