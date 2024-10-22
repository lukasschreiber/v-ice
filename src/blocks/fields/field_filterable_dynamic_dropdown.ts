import * as Blockly from 'blockly/core';
import { FieldDynamicDropdown } from './field_dynamic_dropdown';

export class FieldFilterableDynamicDropdown extends FieldDynamicDropdown {
    protected workspace_: Blockly.WorkspaceSvg | null = null;

    protected searchDiv_: HTMLDivElement | null = null;
    protected searchInput_: HTMLInputElement | null = null;

    override initView(): void {
        super.initView()

        this.searchDiv_ = document.createElement("div")
        this.searchInput_ = document.createElement("input")
        this.searchInput_.type = "text"
        this.searchInput_.placeholder = "Filter Options..."
        this.searchInput_.classList.add("blocklyMenuFilter")
        this.searchDiv_.style.marginBottom = "5px"

        this.searchDiv_.appendChild(this.searchInput_)
        
        this.searchDiv_.addEventListener("keyup", (e) => {
            const target = e.target as HTMLInputElement
            Blockly.DropDownDiv.getContentDiv().querySelectorAll(".blocklyMenuItem").forEach(option => {
                if(!option.textContent?.toLowerCase().includes(target.value.toLowerCase())) {
                    option.classList.add("hidden")
                } else {
                    option.classList.remove("hidden")
                }
            })
        })
    }

    protected override showEditor_(e?: MouseEvent | undefined): void {
        super.showEditor_(e)

        const div = Blockly.DropDownDiv.getContentDiv()
        div.insertBefore( this.searchDiv_!, div.firstChild)

    }

    override applyColour() {
        super.applyColour()
        const style = (this.sourceBlock_ as Blockly.BlockSvg).style;
        if(this.searchInput_) {
            this.searchInput_.style.background = style.colourTertiary
        }
    }
}

Blockly.fieldRegistry.register('field_filterable_dynamic_dropdown', FieldFilterableDynamicDropdown);