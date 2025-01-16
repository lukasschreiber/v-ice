import * as Blockly from "blockly/core";
import { FieldTextInput } from "./field_textinput";
import { FieldTextInputValidator, FieldTextInputConfig } from 'blockly/core/field_textinput'
import { Hierarchy, IHierarchyEntry } from "@/data/hierarchy";
import { IconFactory } from "../icon_factory";
import { TypedField } from "./field";
import types from "@/data/types";

export class FieldHierarchy extends FieldTextInput implements TypedField {
    protected hierarchy_: Hierarchy | null = null;
    protected dropdownContainer_: HTMLDivElement | null = null;
    private boundEvents: Blockly.browserEvents.Data[] = [];

    protected validPrefix_: string | null = null;

    constructor(value?: string, validator?: FieldTextInputValidator | null, restrictor?: RegExp, config?: FieldHierarchyConfig) {
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
                
                const option = this.hierarchy_?.getAllEntryNames().find(option => option.toLowerCase() === value.toLowerCase());
                if (option) {
                    return option
                }

                return null;
            })
        }
    }

    protected override configure_(config: FieldHierarchyConfig) {
        super.configure_(config);

        this.hierarchy_ = config.hierarchy || null;
    }

    getOutputType() {
        return types.hierarchy(this.hierarchy_?.getName() || "unknown");
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

    private dropdownShow(value: string) {
        if (!this.hierarchy_) {
            Blockly.DropDownDiv.hideIfOwner(this, true);
            Blockly.WidgetDiv.getDiv()?.querySelector("input")?.focus();
            return;
        }

        const route = this.hierarchy_.getEntriesOnRoute(value)

        const fallbackCode = Object.keys(this.hierarchy_.getRoot().children)[0];
        const fallbackRoute = [{ ...this.hierarchy_.getRoot(), code: fallbackCode }];

        const editor = this.dropdownCreate(route.length === 0 ? fallbackRoute : route);
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

    private dropdownCreate(route: (IHierarchyEntry & { code: string })[]): Element {
        this.dropdownContainer_ = document.createElement("div")
        this.dropdownContainer_.className = "blocklyHierarchyMenu"

        const style = this.constants_!.getBlockStyle(this.sourceBlock_!.getStyleName());

        route.forEach((_, index) => {
            const div = document.createElement("div");

            if (index !== 0) {
                const minus = document.createElement("button");
                minus.className = "px-2 font-bold";
                minus.appendChild(IconFactory.wrapIcon(IconFactory.createMinusIcon("white", 10)))
                minus.addEventListener("click", () => {
                    const newValue = index === 0 ? Object.keys(this.hierarchy_!.getRoot().children)[0] : route[index - 1].code;
                    this.setValue(newValue);
                    this.htmlInput_!.value = newValue;
                    // this.hide(true);
                });
                div.appendChild(minus);
            } else {
                const spacer = document.createElement("div");
                spacer.style.width = "28px";
                div.appendChild(spacer);
            }

            const select = document.createElement("select");
            select.className = "max-w-[300px] border text-white text-sm p-1 outline-none"
            select.style.backgroundColor = style.colourSecondary;
            select.style.borderColor = style.colourTertiary;
            select.style.borderRadius = `${this.constants_!.CORNER_RADIUS}px`


            select.addEventListener("change", (e) => {
                this.setValue((e.target as HTMLSelectElement).value);
                this.htmlInput_!.value = (e.target as HTMLSelectElement).value;
                // this.hide(true);
            });

            select.textContent = route[index].name;

            const entry: IHierarchyEntry = index === 0 ? this.hierarchy_!.getRoot() : route[index - 1];

            for (const key in entry.children) {
                const child = entry.children[key];
                const optionElement = document.createElement("option");
                optionElement.value = key;
                optionElement.textContent = child.name;

                if (key === route[index].code) {
                    optionElement.selected = true;
                }

                select.appendChild(optionElement);
            }

            if (Object.keys(entry.children).length <= 1) {
                select.disabled = true;
            }

            div.appendChild(select);

            this.dropdownContainer_!.appendChild(div);
        });

        if (route.length - 1 >= 0 && route[route.length - 1].children) {
            const plusWrapper = document.createElement("div");
            const plus = document.createElement("button");
            plus.appendChild(IconFactory.wrapIcon(IconFactory.createPlusIcon("white", 10)));
            plus.className = "px-2 font-bold h-7"
            plus.addEventListener("click", () => {
                this.setValue(Object.keys(route[route.length - 1].children)[0]);
                this.htmlInput_!.value = Object.keys(route[route.length - 1].children)[0];
                // this.hide(true);
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
            this.value_ = this.validPrefix_ || this.valueWhenEditorWasOpened_ || "";
        }
        super.onFinishEditing_(_value);
    }

    // private hide(opt_skipAnimation?: boolean) {
    //     Blockly.DropDownDiv.hideIfOwner(this, opt_skipAnimation);
    //     Blockly.WidgetDiv.hide();
    // }

    setValue(newValue: string | undefined, fireChangeEvent?: boolean | undefined): void {
        super.setValue(newValue, fireChangeEvent);
        this.forceRerender();

        this.validPrefix_ = this.getLongestValidPrefix(newValue || "");

        Blockly.renderManagement.finishQueuedRenders().then(() => {
            if ((Blockly.DropDownDiv.getOwner() === this || !Blockly.DropDownDiv.isVisible()) && this.isBeingEdited_) {
                this.dropdownDispose();
                this.dropdownShow(this.validPrefix_ || "");
            }
        })
    }

    private getLongestValidPrefix(value: string): string | null {
        let current = value;

        while (current.length > 0) {
            if (this.validator_?.call(this, current)) {
                return current;
            }
            current = current.slice(0, -1);
        }

        return this.validator_?.call(this, value) ?? null;
    }

    setHierarchy(hierarchy: Hierarchy) {
        this.hierarchy_ = hierarchy;
    }

    static fromJson(options: FieldHierarchyFromJsonConfig): FieldHierarchy {
        return new this(options.text, undefined, undefined, options);
    }
}

Blockly.fieldRegistry.register('field_hierarchy', FieldHierarchy);

export interface FieldHierarchyConfig extends FieldTextInputConfig {
    hierarchy?: Hierarchy;
}

export interface FieldHierarchyFromJsonConfig extends Blockly.FieldTextInputFromJsonConfig {
    hierarchy?: Hierarchy;
}
