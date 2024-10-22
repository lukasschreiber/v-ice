import types from '@/data/types';
import { ConstantProvider } from '@/renderer/constants';
import * as Blockly from 'blockly/core';
import { FieldTextInputValidator, FieldTextInputConfig } from 'blockly/core/field_textinput'

export class FieldTextInput extends Blockly.FieldTextInput {
    constructor(value?: string, validator?: FieldTextInputValidator | null, restrictor?: RegExp, config?: FieldTextInputConfig) {
        super(value, validator, config)
        this.restrictor_ = restrictor
    }


    private onKeyDownWrapper: Blockly.browserEvents.Data | null = null;
    private onKeyInputWrapper: Blockly.browserEvents.Data | null = null;
    private onKeyUpWrapper_: Blockly.browserEvents.Data | null = null;
    private onKeyPressWrapper_: Blockly.browserEvents.Data | null = null;
    private onInputWrapper_: Blockly.browserEvents.Data | null = null;

    private restrictor_: RegExp | undefined = undefined;

    setRestrictor(restrictor?: RegExp) {
        this.restrictor_ = restrictor;
    }

    protected override bindInputEvents_(htmlInput: HTMLElement): void {
        // Trap Enter without IME and Esc to hide.
        this.onKeyDownWrapper = Blockly.browserEvents.conditionalBind(
            htmlInput,
            'keydown',
            this,
            this.onHtmlInputKeyDown_,
        );
        // Resize after every input change.
        this.onKeyInputWrapper = Blockly.browserEvents.conditionalBind(
            htmlInput,
            'keypress',
            this,
            this.onHtmlInputChange,
        );
    }

    protected override unbindInputEvents_() {
        if (this.onKeyDownWrapper) {
            Blockly.browserEvents.unbind(this.onKeyDownWrapper);
            this.onKeyDownWrapper = null;
        }
        if (this.onKeyInputWrapper) {
            Blockly.browserEvents.unbind(this.onKeyInputWrapper);
            this.onKeyInputWrapper = null;
        }
    }

    protected unbindEvents_() {
        if (this.onKeyUpWrapper_) Blockly.browserEvents.unbind(this.onKeyUpWrapper_)
        if (this.onKeyPressWrapper_) Blockly.browserEvents.unbind(this.onKeyPressWrapper_)
        if (this.onInputWrapper_) Blockly.browserEvents.unbind(this.onInputWrapper_)
    }

    protected override showEditor_(_e?: Event | undefined, quietInput?: boolean | undefined): void {
        super.showEditor_(_e, quietInput)

        // TODO: this can't be right
        // if the shape is a rectangle, the border radius should be 3px
        const check = this.getParentInput().getSourceBlock().outputConnection?.getCheck()
        if(check?.[0] && Blockly.WidgetDiv.getDiv()) {
            const type = types.utils.fromString(check[0])
            const constants = this.constants_ as ConstantProvider | null
            if (constants?.shapeForType(type).type === constants?.SHAPES.SQUARE) {
                Blockly.WidgetDiv.getDiv()!.style.borderRadius = "3px";
                Blockly.WidgetDiv.getDiv()!.querySelector("input")!.style.borderRadius = "3px";
            }
        }
       

        if (this.htmlInput_ !== null) {
            this.onKeyUpWrapper_ = Blockly.browserEvents.conditionalBind(this.htmlInput_, 'keyup', this, this.onHtmlInputChange);
            this.onKeyPressWrapper_ = Blockly.browserEvents.conditionalBind(this.htmlInput_, 'keypress', this, this.onHtmlInputChange);
            this.onInputWrapper_ = Blockly.browserEvents.bind(this.htmlInput_, 'input', this, this.onHtmlInputChange);
        }
    }

    protected override widgetDispose_(): void {
        super.widgetDispose_()
        this.unbindEvents_()
    }

    private onHtmlInputChange(e: KeyboardEvent) {
        // Check if the key matches the restrictor.
        if (e.type === 'keypress' && this.restrictor_ !== undefined) {
            const isWhitelisted = false;
            if (!isWhitelisted && !this.restrictor_.test(e.key) && e.preventDefault) {
                // Failed to pass restrictor.
                e.preventDefault();
                return;
            }
        }

        // the normal Blockly implementation of onHtmlInputChange_ which cannot be called because it is private
        const oldValue = this.value_;
        this.setValue(this.getValueFromEditorText_(this.htmlInput_!.value), false);
        if (
            this.sourceBlock_ &&
            Blockly.Events.isEnabled() &&
            this.value_ !== oldValue
        ) {
            Blockly.Events.fire(
                new (Blockly.Events.get(Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE))(
                    this.sourceBlock_,
                    this.name || null,
                    oldValue,
                    this.value_,
                ),
            );
        }
    }

    static fromJson(options: Blockly.FieldTextInputFromJsonConfig) {
        return new this(Blockly.utils.parsing.replaceMessageReferences(options.text), undefined, undefined, options);
    }
}

Blockly.fieldRegistry.register('field_textinput', FieldTextInput);