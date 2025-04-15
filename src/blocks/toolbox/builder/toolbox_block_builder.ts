import { AnyRegistrableBlock, BlockLinesDefinition } from "@/blocks/block_definitions";
import { BlockFields, BlockInputs, GenericBlockDefinition, IsHiddenFunc } from "./definitions";
import { TypeChecker } from "@/data/type_checker";
import types from "@/data/types";
import { NumberBlock } from "@/blocks/definitions/math";

export class ToolboxBlockBuilder<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> {
    protected type: string;
    protected block: T;
    protected isHidden?: IsHiddenFunc = false;
    protected fields?: BlockFields<L, T>;
    protected inputs?: BlockInputs<L, T>;

    constructor(block: T) {
        this.type = block.id;
        this.block = block;
    }

    withFields(fields: BlockFields<L, T>) {
        this.fields = fields;
        return this;
    }

    withInputs(inputs: BlockInputs<L, T>) {
        this.inputs = inputs;
        return this;
    }

    withEmptyInputs() {
        for (const line of this.block.lines) {
            for (const element of line.args) {
                if (element.type === "input_value") {
                    if (!element.check) continue;
                    if (typeof element.check === "string") element.check = types.utils.fromString(element.check);

                    if (TypeChecker.checkTypeCompatibility(element.check, types.number)) {
                        if (!this.inputs) this.inputs = {} as BlockInputs<L, T>;
                        // @ts-ignore Types are complex here....
                        this.inputs[element.name] = {
                            shadow: mathNumberNull
                        }
                    }
                }
            }
        }

        return this;
    }

    withCondition(condition: IsHiddenFunc) {
        this.isHidden = condition;
        return this;
    }

    build(): GenericBlockDefinition {
        return {
            type: this.type,
            isHidden: this.isHidden,
            fields: this.fields as GenericBlockDefinition["fields"],
            inputs: this.inputs as GenericBlockDefinition["inputs"],
        }
    }
}

const mathNumberNull = new ToolboxBlockBuilder(NumberBlock).withFields({
    NUM: {
        value: ""
    }
}).build()