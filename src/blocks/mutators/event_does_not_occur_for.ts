import types from "@/data/types";
import * as Blockly from "blockly/core"
import { ShadowFactory } from "../shadow_factory";
import { TimeUnit } from "@/generation/timeline_templates";

type EventDoesNotOccurForBlock = Blockly.Block & EventDoesNotOccurForMixin;
interface EventDoesNotOccurForMixin extends EventDoesNotOccurForMixinType { }
type EventDoesNotOccurForMixinType = typeof eventDoesNotOccurForMutator;


const eventDoesNotOccurForMutator = {
  mutationToDom: function (this: EventDoesNotOccurForBlock): Element {
    const container = Blockly.utils.xml.createElement('mutation');
    const timeUnitInput = this.getFieldValue('OP') === 'DOES_NOT_OCCUR_FOR';
    container.setAttribute('time_unit_input', String(timeUnitInput));
    return container;
  },

  domToMutation: function (this: EventDoesNotOccurForBlock, xmlElement: Element) {
    const timeUnitInput = xmlElement.getAttribute('time_unit_input') === 'true';
    this.updateShape_(timeUnitInput);
  },

  updateShape_: function (this: EventDoesNotOccurForBlock, timeUnitInput: boolean) {
    // Add or remove a Value Input.
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
  },
};

const eventDoesNotOccurForExtension = function (this: EventDoesNotOccurForBlock) {
  this.getField('OP')!.setValidator(
    /** @param option The selected dropdown option. */
    function (this: Blockly.FieldDropdown, option: string) {
      const timeUnitInput = option === 'DOES_NOT_OCCUR_FOR';
      (this.getSourceBlock() as EventDoesNotOccurForBlock).updateShape_(timeUnitInput);
      return undefined; // FieldValidators can't be void.  Use option as-is.
    },
  );
};

Blockly.Extensions.registerMutator(
  'event_does_not_occur_for_mutator',
  eventDoesNotOccurForMutator,
  eventDoesNotOccurForExtension,
);