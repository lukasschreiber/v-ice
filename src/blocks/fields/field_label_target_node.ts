import * as Blockly from "blockly/core"
import { TypedField } from "./field"
import types from "@/data/types"

export interface FieldLabelFromJsonConfig extends Blockly.FieldLabelFromJsonConfig {
    id?: string
}

export interface FieldLabelTargetNodeState {
    id: string | undefined
    name: string | null
}

export class FieldLabelTargetNode extends Blockly.FieldLabelSerializable implements TypedField {
    protected id: string | undefined = undefined
    constructor(value: string, id?: string, textClass?: string, config?: Blockly.FieldLabelConfig) {
        super(value, textClass, config);
        this.id = id
    }

    getName() {
        return this.getValue()
    }

    getId() {
        return this.id
    }

    setId(id: string) {
        this.id = id
    }

    getOutputType() {
        return types.string
    }

    override saveState(): FieldLabelTargetNodeState {
        return {
            id: this.id,
            name: this.getValue()
        }
    }

    override loadState(state: FieldLabelTargetNodeState): void {
        this.id = state.id
        this.setValue(state.name)
    }

    static override fromJson(options: FieldLabelFromJsonConfig): FieldLabelTargetNode {
        const text = Blockly.utils.parsing.replaceMessageReferences(options.text)
        return new this(text, options.id ?? "default", undefined, options)
    }
}

Blockly.fieldRegistry.register('field_label_target_node', FieldLabelTargetNode);