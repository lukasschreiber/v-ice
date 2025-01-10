import types from "@/data/types";
import * as Blockly from "blockly/core"
import { ShadowFactory } from "../shadow_factory";
import { BlockMutator } from "../block_mutators";

interface DivisiblebyBlock {
    updateShape_(divisorInput: boolean): void
}

export class DivisiblebyMutator extends BlockMutator<Blockly.Block & DivisiblebyBlock> implements DivisiblebyBlock {
    constructor() {
        super("math_is_divisibleby_mutator")
    }

    @BlockMutator.mixin
    updateShape_(this: Blockly.Block & DivisiblebyBlock, divisorInput: boolean) {
        const inputExists = this.getInput('DIVISOR');
        if (divisorInput) {
            if (!inputExists) {
                this.appendValueInput('DIVISOR').setCheck(types.number.name).setShadowDom(ShadowFactory.createShadowForType(types.number));
            }
        } else if (inputExists) {
            this.removeInput('DIVISOR');
        }
    }

    public mutationToDom(this: Blockly.Block & DivisiblebyBlock): Element {
        const container = Blockly.utils.xml.createElement('mutation');
        const divisorInput = this.getFieldValue('PROPERTY') === 'DIVISIBLE_BY';
        container.setAttribute('divisor_input', String(divisorInput));
        return container;
    }

    public domToMutation(this: Blockly.Block & DivisiblebyBlock, xmlElement: Element) {
        const divisorInput = xmlElement.getAttribute('divisor_input') === 'true';
        this.updateShape_(divisorInput);
    }

    public extension(this: Blockly.Block & DivisiblebyBlock): void {
        this.getField('PROPERTY')!.setValidator(
            /** @param option The selected dropdown option. */
            function (this: Blockly.FieldDropdown, option: string) {
                const divisorInput = option === 'DIVISIBLE_BY';
                (this.getSourceBlock() as Blockly.Block & DivisiblebyBlock).updateShape_(divisorInput);
                return undefined; // FieldValidators can't be void.  Use option as-is.
            },
        );
    }
}