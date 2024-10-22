import types from "@/data/types";
import * as Blockly from "blockly/core"
import { ShadowFactory } from "../shadow_factory";

type DivisiblebyBlock = Blockly.Block & DivisiblebyMixin;
interface DivisiblebyMixin extends DivisiblebyMixinType {}
type DivisiblebyMixinType = typeof isDivisibleByMutator;


const isDivisibleByMutator = {
  mutationToDom: function (this: DivisiblebyBlock): Element {
    const container = Blockly.utils.xml.createElement('mutation');
    const divisorInput = this.getFieldValue('PROPERTY') === 'DIVISIBLE_BY';
    container.setAttribute('divisor_input', String(divisorInput));
    return container;
  },

  domToMutation: function (this: DivisiblebyBlock, xmlElement: Element) {
    const divisorInput = xmlElement.getAttribute('divisor_input') === 'true';
    this.updateShape_(divisorInput);
  },

  updateShape_: function (this: DivisiblebyBlock, divisorInput: boolean) {
    // Add or remove a Value Input.
    const inputExists = this.getInput('DIVISOR');
    if (divisorInput) {
      if (!inputExists) {
        this.appendValueInput('DIVISOR').setCheck(types.number.name).setShadowDom(ShadowFactory.createShadowForType(types.number));
      }
    } else if (inputExists) {
      this.removeInput('DIVISOR');
    }
  },
};

const isDivisibleByExtension = function (this: DivisiblebyBlock) {
  this.getField('PROPERTY')!.setValidator(
    /** @param option The selected dropdown option. */
    function (this: Blockly.FieldDropdown, option: string) {
      const divisorInput = option === 'DIVISIBLE_BY';
      (this.getSourceBlock() as DivisiblebyBlock).updateShape_(divisorInput);
      return undefined; // FieldValidators can't be void.  Use option as-is.
    },
  );
};

Blockly.Extensions.unregister('math_is_divisibleby_mutator');
Blockly.Extensions.registerMutator(
  'math_is_divisibleby_mutator',
  isDivisibleByMutator,
  isDivisibleByExtension,
);