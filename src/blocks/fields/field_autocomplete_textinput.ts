import * as Blockly from "blockly/core";
import { FieldTextInput } from "./field_textinput";
import { FieldTextInputValidator, FieldTextInputConfig } from 'blockly/core/field_textinput'
import { TypedField } from "./field";
import types from "@/data/types";

export class FieldAutocompleteText extends FieldTextInput implements TypedField {
    private boundEvents: Blockly.browserEvents.Data[] = [];

    protected autoCompleteOptions_: string[] = [];
    protected selectedOptionIndex_: number | null = null;
    protected dropdownContainer_: HTMLDivElement | null = null;

    constructor(value?: string, validator?: FieldTextInputValidator | null, restrictor?: RegExp, config?: FieldAutocompleteTextConfig) {
        super(value, validator, restrictor, config)

        if (config) {
            this.configure_(config);
        }

        this.setValue(value);
        if (validator) {
            this.setValidator(validator);
        } else {
            this.setValidator((value) => {
                if (value === "") {
                    return "";
                }

                const option = this.autoCompleteOptions_.find(option => option.toLowerCase() === value.toLowerCase())
                if (option !== undefined) {
                    return option
                }

                return null;
            })
        }
    }

    protected override configure_(config: FieldAutocompleteTextConfig) {
        super.configure_(config);

        this.autoCompleteOptions_ = config.autoCorrectOptions || [];
    }

    protected override showEditor_(e?: Event) {
        // Mobile browsers have issues with in-line textareas (focus & keyboards).
        const noFocus =
            Blockly.utils.userAgent.MOBILE ||
            Blockly.utils.userAgent.ANDROID ||
            Blockly.utils.userAgent.IPAD;
        super.showEditor_(e, noFocus);

        this.dropdownShow(this.getValue() || "");
    }

    getOutputType() {
        return types.string
    }

    setValue(newValue: string | undefined, fireChangeEvent?: boolean | undefined): void {
        super.setValue(newValue, fireChangeEvent);

        if (newValue !== undefined && newValue !== "" && fireChangeEvent) {
            this.selectedOptionIndex_ = null;
        }

        if ((Blockly.DropDownDiv.getOwner() === this || !Blockly.DropDownDiv.isVisible()) && this.isBeingEdited_) {
            this.dropdownDispose();
            this.dropdownShow(newValue || "");
        }
    }

    protected getFilteredAutocorrectOptions(value: string): string[] {
        return this.autoCompleteOptions_.filter(option => option.toLowerCase().includes(value.toLowerCase()));
    }

    private dropdownShow(value: string) {
        const autoCorrectOptions = this.getFilteredAutocorrectOptions(value);
        if (autoCorrectOptions.length === 0) {
            Blockly.DropDownDiv.hideIfOwner(this, true);
            Blockly.WidgetDiv.getDiv()?.querySelector("input")?.focus();
            return;
        }

        const editor = this.dropdownCreate(autoCorrectOptions);
        Blockly.DropDownDiv.getContentDiv().appendChild(editor);

        const sourceBlock = this.getSourceBlock();
        if (sourceBlock instanceof Blockly.BlockSvg) {
            Blockly.DropDownDiv.setColour(
                sourceBlock.style.colourPrimary,
                sourceBlock.style.colourTertiary,
            );
        }

        Blockly.DropDownDiv.showPositionedByField(
            this,
            this.dropdownDispose.bind(this),
        );
    }

    private dropdownCreate(options: string[]): Element {
        this.dropdownContainer_ = document.createElement("div")
        this.dropdownContainer_.className = "blocklyAutocompleteMenu"

        let index = 0;
        for (const option of options) {
            const text = document.createElement("div");
            text.textContent = option;
            
            if (index === this.selectedOptionIndex_) {
                text.className = "selected";
            }

            text.onclick = () => {
                this.setValue(option);
                this.hide(true);
            }
            this.dropdownContainer_.appendChild(text);

            index++;
        }

        return this.dropdownContainer_;
    }

    private dropdownDispose() {
        for (const event of this.boundEvents) {
            Blockly.browserEvents.unbind(event);
        }
        this.boundEvents.length = 0;

        this.dropdownContainer_?.remove();
        this.dropdownContainer_ = null;
    }

    private hide(opt_skipAnimation?: boolean) {
        Blockly.DropDownDiv.hideIfOwner(this, opt_skipAnimation);
        Blockly.WidgetDiv.hide();
    }

    protected override onHtmlInputKeyDown_(e: KeyboardEvent): void {
        super.onHtmlInputKeyDown_(e);

        const block = this.getSourceBlock();
        if (!block) {
            throw new Error(
                'The field has not yet been attached to its input. ' +
                'Call appendField to attach it.',
            );
        }

        const value = (e.target as HTMLInputElement).value
        const options = this.getFilteredAutocorrectOptions(value);

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                if (this.selectedOptionIndex_ === null) {
                    this.selectedOptionIndex_ = 0;
                } else {
                    this.selectedOptionIndex_ = this.selectedOptionIndex_ + 1 === options.length ? 0 : this.selectedOptionIndex_ + 1;
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (this.selectedOptionIndex_ === null) {
                    this.selectedOptionIndex_ = options.length - 1;
                } else {
                    this.selectedOptionIndex_ = this.selectedOptionIndex_ === 0 ? options.length - 1 : this.selectedOptionIndex_ - 1;
                }
                break;
            case "Enter":
                e.preventDefault();
                break;
            case "Escape":
                this.hide();
                break;
            case "Tab":
                if (options.length === 1) {
                    this.setValue(options[0]);
                    this.hide();
                } else if (this.selectedOptionIndex_ !== null) {
                    this.setValue(options[this.selectedOptionIndex_]);
                    this.hide();
                }
                break;
        }
    }

    setAutoCompleteOptions(options: string[]) {
        this.autoCompleteOptions_ = options;
    }

    static fromJson(options: FieldAutocompleteTextFromJsonConfig): FieldAutocompleteText {
        return new this(options.text, undefined, undefined, options);
    }
}

export interface FieldAutocompleteTextConfig extends FieldTextInputConfig {
    autoCorrectOptions?: string[];
}

export interface FieldAutocompleteTextFromJsonConfig extends Blockly.FieldTextInputFromJsonConfig {
    autoCorrectOptions?: string[];
}

Blockly.fieldRegistry.register('field_autocomplete_text', FieldAutocompleteText);