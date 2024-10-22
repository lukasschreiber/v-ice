import * as Blockly from "blockly/core"

class ValueUpdateEvent extends Blockly.Events.Abstract {
    override isBlank: boolean = false
    varId: string

    constructor(varId: string) {
        super()
        this.varId = varId
    }
}

export class FieldVariable extends Blockly.FieldVariable {
    override EDITABLE: boolean = false

    protected override render_(): void {
        this.textContent_!.nodeValue = this.getDisplayText_()
        this.updateSize_()
    }

    protected override doValueUpdate_(newId: string) {
        super.doValueUpdate_(newId);
        if (this.onvaluechange) {
            this.onvaluechange(new ValueUpdateEvent(newId))
        }
    }

    private onvaluechange: ((event: ValueUpdateEvent) => void) | null = null

    setOnValueChange(callback: (event: ValueUpdateEvent) => void) {
        this.onvaluechange = callback
    }
    
    override initView(): void {
        this.createTextElement_()
    }

    override isClickable(): boolean {
        return false
    }

    static fromJson(options: Blockly.FieldVariableFromJsonConfig) {
        return new this(options.variable ?? null, undefined, options.variableTypes, options.defaultType, options)
    }
}

Blockly.fieldRegistry.unregister("field_variable")
Blockly.fieldRegistry.register('field_variable', FieldVariable);