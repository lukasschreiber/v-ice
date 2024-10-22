import * as Blockly from 'blockly/core';
import { FieldTextInput } from '@/blocks/fields/field_textinput';
import { FieldTextInputValidator } from 'blockly/core/field_textinput'

export interface FieldNumberFromJsonConfig extends Blockly.FieldTextInputFromJsonConfig {
    min?: number,
    max?: number,
    precision?: number,
    value?: number
}

export class FieldNumber extends FieldTextInput {

    constructor(value?: number | string, min?: number, max?: number, precision?: number, validator?: FieldTextInputValidator) {
        super((value && isNaN(value as unknown as number)) ? String(value) : "0", validator)
        this.setRestrictor(this.getNumRestrictor(min, max, precision))
        this.setValidator(this.getNumValidator(min, max, precision))
    }

    private decimalAllowed_: boolean = false
    private negativeAllowed_: boolean = false
    private exponentialAllowed_: boolean = false

    protected getNumValidator(min?: number, max?: number, precision?: number) {
        this.setConstraints_(min, max, precision)
        return (value: string) => {
            if (value === "") {
                return ""
            }

            if (this.decimalAllowed_ && value === ".") {
                return null
            }

            if (this.exponentialAllowed_ && (value === "e" || value === "E")) {
                return null
            }

            if (this.negativeAllowed_ && value === "-") {
                return null
            }

            if (value === "-." || value === "-e" || value === "-E") {
                return null
            }

            if (value === "." || value === "e" || value === "E") {
                return null
            }

            if (isNaN(Number(value))) {
                return null
            }

            let num = Number(value)

            if (min !== undefined && num < min) {
                return null
            }

            if (max !== undefined && num > max) {
                return null
            }

            if (precision !== undefined) {
                num = parseFloat(num.toFixed(precision))
            }

            return num.toString()
        }
    }

    protected getNumRestrictor(min?: number, max?: number, precision?: number): RegExp {
        this.setConstraints_(min, max, precision);

        let pattern = "[\\d]"; // Always allow digits.
        if (this.decimalAllowed_) {
            pattern += "|[\\.]";
        }
        if (this.negativeAllowed_) {
            pattern += "|[-]";
        }
        if (this.exponentialAllowed_) {
            pattern += "|[eE]";
        }

        return new RegExp(pattern);
    }

    protected setConstraints_(min?: number, _max?: number, precision?: number) {
        this.decimalAllowed_ = precision === undefined || isNaN(precision) || (precision === 0) || (Math.floor(precision) !== precision);
        this.negativeAllowed_ = min === undefined || isNaN(min) || min < 0;
        this.exponentialAllowed_ = this.decimalAllowed_;
    }

    static fromJson(options: FieldNumberFromJsonConfig): FieldNumber {
        return new FieldNumber(options.value, options.min, options.max, options.precision, undefined)
        
    }
}

Blockly.fieldRegistry.unregister("field_number")
Blockly.fieldRegistry.register('field_number', FieldNumber);

