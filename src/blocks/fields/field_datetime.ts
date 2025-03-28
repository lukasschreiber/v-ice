import * as Blockly from "blockly/core";
import { FieldTextInput } from "./field_textinput";
import { FieldTextInputValidator, FieldTextInputConfig } from 'blockly/core/field_textinput'
import { DateTime } from "luxon";
import { IconFactory } from "../icon_factory";
import { DateTimeGranularity, DateTimeGranularityFormat, DateTimeGranularityFormats, DateTimeGranularityLabels, maskFormatString, parseDate } from "@/utils/datetime";
import { TypedField } from "./field";
import types from "@/data/types";
import { debug } from "@/utils/logger";

export class FieldDateTime extends FieldTextInput implements TypedField {
    protected dateTime_: DateTime | null = null;

    protected format_: DateTimeGranularityFormat | null = null;
    protected formatGranularity_: DateTimeGranularity | null = null;
    protected maxGranularity_: DateTimeGranularity | null = null;
    protected maskedEntries_: DateTimeGranularity[] = [];
    protected validDate_: string | null = null;


    protected dropdownContainer_: HTMLDivElement | null = null;
    private boundEvents: Blockly.browserEvents.Data[] = [];

    constructor(value?: string, validator?: FieldTextInputValidator | null, restrictor?: RegExp, config?: FieldDateTimeConfig) {
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

                // the value must always be a prefix of a valid date, a valid date is defined by the format.
                // any part of a date, for example the year may be masked, that is replaced by a ** or ****

                const { timestamp } = parseDate(value, this.format_);
                if (timestamp === null) {
                    return null;
                }

                return value;
            })
        }
    }

    protected override configure_(config: FieldDateTimeConfig) {
        super.configure_(config);

        this.format_ = config.formatName ?? DateTimeGranularityFormat.LOCALE;
        this.dateTime_ = config.timestamp === undefined ? null : DateTime.fromISO(config.timestamp);
        this.maskedEntries_ = config.maskedEntries ?? [];
        this.formatGranularity_ = config.formatGranularity ?? null;
        this.maxGranularity_ = config.maxGranularity ?? DateTimeGranularity.SECOND;
    }

    getOutputType() {
        return types.timestamp;
    }

    protected override showEditor_(e?: Event) {
        // Mobile browsers have issues with in-line textareas (focus & keyboards).
        const noFocus =
            Blockly.utils.userAgent.MOBILE ||
            Blockly.utils.userAgent.ANDROID ||
            Blockly.utils.userAgent.IPAD;
        super.showEditor_(e, noFocus);

        this.dropdownShow(this.getValue());
    }

    private dropdownShow(newValue: string | null) {
        if (this.formatGranularity_ === null || this.format_ === null || this.maskedEntries_ === null || (newValue === null && this.dateTime_ === null)) {
            debug("Returning in dropdown show").addVariables({"format": this.format_, "maskedEntries": this.maskedEntries_, "formatGranularity": this.formatGranularity_, "newValue": newValue, "dateTime": this.dateTime_?.toISO(), "validDate": this.validDate_, "value": this.value_}).log()
            Blockly.DropDownDiv.hideIfOwner(this, true);
            Blockly.WidgetDiv.getDiv()?.querySelector("input")?.focus();
            return;
        }

        const editor = this.dropdownCreate(newValue);
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

    private dropdownCreate(newValue: string | null): Element {
        this.dropdownContainer_ = document.createElement("div")
        this.dropdownContainer_.className = "blocklyDateMenu"

        const style = this.constants_!.getBlockStyle(this.sourceBlock_!.getStyleName());

        if (this.format_ === null || this.maskedEntries_ === null || this.formatGranularity_ === null || (newValue === null && this.dateTime_ === null)) {
            debug("returning dropdown container").addVariables({"format": this.format_, "maskedEntries": this.maskedEntries_, "formatGranularity": this.formatGranularity_, "newValue": newValue, "dateTime": this.dateTime_?.toISO(), "validDate": this.validDate_, "value": this.value_}).log()
            return this.dropdownContainer_;
        }
        
        const getUnmaskedDate = (value: string) => {
            const { timestamp } = parseDate(value, this.format_);
            return DateTime.fromISO(timestamp!)
        }
        const newDateTimeTest = newValue === null ? this.dateTime_! : getUnmaskedDate(newValue)
        const newDateTime = newDateTimeTest.isValid ? newDateTimeTest : DateTime.local();
        
        const granularityProperties = Object.values(DateTimeGranularity);
        for (let i = 0; i <= granularityProperties.indexOf(this.formatGranularity_); i++) {
            const granularity = granularityProperties[i];
            const div = document.createElement("div");

            if (i !== 0) {
                const minus = document.createElement("button");
                minus.className = "px-2 font-bold";
                minus.appendChild(IconFactory.wrapIcon(IconFactory.createMinusIcon("white", 10)))
                const previousGranularityFormat = DateTimeGranularityFormats[this.format_][granularityProperties[i - 1]];
                minus.addEventListener("click", () => {
                    const newValue = newDateTime.toFormat(maskFormatString(previousGranularityFormat, this.maskedEntries_));
                    this.setValue(newValue);
                    this.htmlInput_!.value = newValue;
                });
                div.appendChild(minus);
            } else {
                const spacer = document.createElement("div");
                spacer.style.width = "28px";
                div.appendChild(spacer);
            }

            const label = document.createElement("label");
            label.textContent = DateTimeGranularityLabels[granularity];
            label.className = "text-white text-sm"
            div.appendChild(label);

            const select = document.createElement("select");
            select.className = "max-w-[300px] border text-white text-sm p-1 outline-none"
            select.style.backgroundColor = style.colourSecondary;
            select.style.borderColor = style.colourTertiary;
            select.style.borderRadius = `${this.constants_!.CORNER_RADIUS}px`

            const options: [string, string, string, boolean][] = [] // [display, value, granularity, selected]
            options.push(["any", "ANY", granularity, this.maskedEntries_.includes(granularity)])
            if (granularity === DateTimeGranularity.YEAR) {
                const currentYear = DateTime.local().year;
                for (let year = currentYear; year >= currentYear - 100; year--) {
                    const dateTime = DateTime.fromObject({ year });
                    const yearString = dateTime.toFormat("yyyy");
                    options.push([yearString, yearString, DateTimeGranularity.YEAR, year === newDateTime.year && !this.maskedEntries_.includes(granularity)]);
                }

                if (newDateTime.year < currentYear - 100 && !this.maskedEntries_.includes(DateTimeGranularity.YEAR)) {
                    const yearString = newDateTime.year.toString();
                    options.push([yearString, yearString, DateTimeGranularity.YEAR, true])

                }
            } else if (granularity === DateTimeGranularity.MONTH) {
                for (let month = 1; month <= 12; month++) {
                    DateTime.fromObject({ year: newDateTime.year, month })
                    const monthString = DateTime.fromObject({ year: newDateTime.year, month }).toFormat("MM");
                    options.push([monthString, monthString, DateTimeGranularity.MONTH, month === newDateTime.month && !this.maskedEntries_.includes(granularity)]);
                }
            } else if (granularity === DateTimeGranularity.DAY) {
                const daysInMonth = DateTime.fromObject({ year: newDateTime.year, month: newDateTime.month }).daysInMonth ?? 31;
                for (let day = 1; day <= daysInMonth; day++) {
                    const dayString = DateTime.fromObject({ year: newDateTime.year, month: newDateTime.month, day }).toFormat("dd");
                    options.push([dayString, dayString, DateTimeGranularity.DAY, day === newDateTime.day && !this.maskedEntries_.includes(granularity)]);
                }
            } else if (granularity === DateTimeGranularity.HOUR) {
                for (let hour = 0; hour < 24; hour++) {
                    const hourString = DateTime.fromObject({ year: newDateTime.year, month: newDateTime.month, day: newDateTime.day, hour }).toFormat("HH");
                    options.push([hourString, hourString, DateTimeGranularity.HOUR, hour === newDateTime.hour && !this.maskedEntries_.includes(granularity)]);
                }
            } else if (granularity === DateTimeGranularity.MINUTE) {
                for (let minute = 0; minute < 60; minute++) {
                    const minuteString = DateTime.fromObject({ year: newDateTime.year, month: newDateTime.month, day: newDateTime.day, hour: newDateTime.hour, minute }).toFormat("mm");
                    options.push([minuteString, minuteString, DateTimeGranularity.MINUTE, minute === newDateTime.minute && !this.maskedEntries_.includes(granularity)]);
                }
            } else if (granularity === DateTimeGranularity.SECOND) {
                for (let second = 0; second < 60; second++) {
                    const secondString = DateTime.fromObject({ year: newDateTime.year, month: newDateTime.month, day: newDateTime.day, hour: newDateTime.hour, minute: newDateTime.minute, second }).toFormat("ss");
                    options.push([secondString, secondString, DateTimeGranularity.SECOND, second === newDateTime.second && !this.maskedEntries_.includes(granularity)]);
                }
            }

            for (const option of options) {
                const optionElement = document.createElement("option");
                optionElement.value = option[2] + "/" + option[1];
                optionElement.textContent = option[0];
                if (option[3]) {
                    optionElement.selected = true;
                }

                select.appendChild(optionElement);
            }

            select.addEventListener("change", (e) => {
                const [unit, value] = (e.target as HTMLSelectElement).value.split("/");
                let newValue = "";
                if (value === "ANY") {
                    // we no the unit and the format, so we just replace the masked entry with a *
                    const format = maskFormatString(DateTimeGranularityFormats[this.format_!][this.formatGranularity_!], [unit as DateTimeGranularity, ...this.maskedEntries_]);
                    newValue = newDateTime.toFormat(format);
                } else {
                    const updatedDateTime = newDateTime.set({ [unit]: parseInt(value) });
                    newValue = updatedDateTime.toFormat(maskFormatString(DateTimeGranularityFormats[this.format_!][this.formatGranularity_!], this.maskedEntries_.filter((entry) => entry !== unit)));
                }
                
                this.setValue(newValue);
                this.htmlInput_!.value = newValue;
            });

            div.appendChild(select);

            this.dropdownContainer_!.appendChild(div);
        }

        if (granularityProperties.indexOf(this.formatGranularity_) < granularityProperties.indexOf(this.maxGranularity_!)) {
            const plusWrapper = document.createElement("div");
            const plus = document.createElement("button");
            plus.appendChild(IconFactory.wrapIcon(IconFactory.createPlusIcon("white", 10)));
            plus.className = "px-2 font-bold h-7"

            const nextGranularity = granularityProperties[granularityProperties.indexOf(this.formatGranularity_) + 1];
            const nextGranularityFormat = DateTimeGranularityFormats[this.format_][nextGranularity];
             // granularityProperties[granularityProperties.indexOf(this.granularity_) + 1];
            plus.addEventListener("click", () => {
                const updatedDateTime = newDateTime.set({ [nextGranularity]: (nextGranularity === DateTimeGranularity.DAY || nextGranularity === DateTimeGranularity.MONTH) ? 1 : 0});
                const newValue = updatedDateTime.toFormat(maskFormatString(nextGranularityFormat, this.maskedEntries_.filter((entry) => entry !== nextGranularity)));
                this.setValue(newValue);
                this.htmlInput_!.value = newValue;
            });

            plusWrapper.appendChild(plus);
            this.dropdownContainer_!.appendChild(plusWrapper);
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

    onFinishEditing_(_value: string): void {
        if (!this.validator_?.call(this, _value)) {
            this.value_ = this.validDate_ || this.valueWhenEditorWasOpened_ || "";
        }
        super.onFinishEditing_(_value);
    }

    setValue(newValue: string | undefined, fireChangeEvent?: boolean | undefined): void {
        const { timestamp, format, maskedEntries, formatGranularity } = parseDate(newValue, this.format_);
        if (!this.dateTime_ && timestamp !== null) {
            this.dateTime_ = DateTime.fromISO(timestamp);
        } else {
            this.dateTime_ = timestamp === null ? null : DateTime.fromISO(timestamp);
        }

        if (this.dateTime_ && format) {
            this.validDate_ = this.dateTime_.toFormat(maskFormatString(DateTimeGranularityFormats[format][formatGranularity!], maskedEntries ?? []));
        }

        this.format_ = format ?? null;
        this.maskedEntries_ = maskedEntries ?? [];
        this.formatGranularity_ = formatGranularity ?? DateTimeGranularity.YEAR;

        super.setValue(newValue, fireChangeEvent);
        this.forceRerender();

        Blockly.renderManagement.finishQueuedRenders().then(() => {
            if ((Blockly.DropDownDiv.getOwner() === this || !Blockly.DropDownDiv.isVisible()) && this.isBeingEdited_) {
                this.dropdownDispose();
                this.dropdownShow((this.validDate_ || newValue) ?? null);
            }
        })
    }

    static fromJson(options: FieldDateTimeFromJsonConfig): FieldDateTime {
        return new this(options.text, undefined, undefined, options);
    }
}

Blockly.fieldRegistry.register('field_datetime', FieldDateTime);

export interface FieldDateTimeConfig extends FieldTextInputConfig {
    timestamp?: string;
    maskedEntries?: DateTimeGranularity[];
    formatName?: DateTimeGranularityFormat;
    formatGranularity?: DateTimeGranularity;
    maxGranularity?: DateTimeGranularity;
}

export interface FieldDateTimeFromJsonConfig extends Blockly.FieldTextInputFromJsonConfig {
    timestamp?: string;
    maskedEntries?: DateTimeGranularity[];
    formatName?: DateTimeGranularityFormat;
    formatGranularity?: DateTimeGranularity;
    maxGranularity?: DateTimeGranularity;
}
