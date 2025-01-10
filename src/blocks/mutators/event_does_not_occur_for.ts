import types from "@/data/types";
import * as Blockly from "blockly/core"
import { ShadowFactory } from "../shadow_factory";
import { TimeUnit } from "@/query/generation/timeline_templates";
import { BlockMutator } from "../block_mutators";

interface EventDoesNotOccurForBlock {
    updateShape_(timeUnitInput: boolean): void
}

export class EventDoesNotOccurForMutator extends BlockMutator<Blockly.Block & EventDoesNotOccurForBlock> implements EventDoesNotOccurForBlock {
    constructor() {
        super("event_does_not_occur_for_mutator")
    }

    @BlockMutator.mixin
    updateShape_(this: Blockly.Block & EventDoesNotOccurForBlock, timeUnitInput: boolean): void {
        const inputExists = this.getInput('TIME');
        if (timeUnitInput) {
            if (!inputExists) {
                this.appendValueInput('TIME').setCheck(types.number.name).setShadowDom(ShadowFactory.createShadowForType(types.number));
                this.appendDummyInput('TIME_UNIT').appendField(new Blockly.FieldDropdown([
                    ["%{BKY_SECONDS}", TimeUnit.SECOND],
                    ["%{BKY_MINUTES}", TimeUnit.MINUTE],
                    ["%{BKY_HOURS}", TimeUnit.HOUR],
                    ["%{BKY_DAYS}", TimeUnit.DAY],
                    ["%{BKY_WEEKS}", TimeUnit.WEEK],
                    ["%{BKY_MONTHS}", TimeUnit.MONTH],
                    ["%{BKY_YEARS}", TimeUnit.YEAR]
                ]), 'TIME_UNIT');

                if (this.getInput('QUERY')) {
                    this.moveInputBefore('TIME_UNIT', 'QUERY');
                    this.moveInputBefore('TIME', 'TIME_UNIT');
                }
            }
        } else if (inputExists) {
            this.removeInput('TIME');
            this.removeInput('TIME_UNIT');
        }
    }

    public mutationToDom(this: Blockly.Block & EventDoesNotOccurForBlock): Element | null {
        const container = Blockly.utils.xml.createElement('mutation');
        const timeUnitInput = this.getFieldValue('OP') === 'DOES_NOT_OCCUR_FOR';
        container.setAttribute('time_unit_input', String(timeUnitInput));
        return container;
    }

    public domToMutation(this: Blockly.Block & EventDoesNotOccurForBlock, xmlElement: Element) {
        const timeUnitInput = xmlElement.getAttribute('time_unit_input') === 'true';
        this.updateShape_(timeUnitInput);
    }

    public extension(this: Blockly.Block & EventDoesNotOccurForBlock): void {
        this.getField('OP')!.setValidator(
            /** @param option The selected dropdown option. */
            function (this: Blockly.FieldDropdown, option: string) {
                const timeUnitInput = option === 'DOES_NOT_OCCUR_FOR';
                (this.getSourceBlock() as Blockly.Block & EventDoesNotOccurForBlock).updateShape_(timeUnitInput);
                return undefined; // FieldValidators can't be void.  Use option as-is.
            },
        );
    }
}