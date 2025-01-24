import * as Blockly from 'blockly';
import { subscribe } from '@/store/subscribe';
import { IconFactory } from '../icon_factory';
import { FieldButton } from '../fields/field_button';
import types from '@/data/types';
import { ShadowFactory } from '../shadow_factory';
import { BlockMutator } from '../block_mutators';

export interface StructSelectBlock {
    variableType: string,
    renderedProperties: Map<string, string>,
    updateOutputType_(): void,
    showAddPropertyMenu_(): void,
    hideAddPropertyMenu_(): void,
    addPropertyInput_(name: string, id?: string): Blockly.Input | null,
    removePropertyInput_(input: Blockly.Input): void,
    getPropertyInputs(): Blockly.Input[],
    focusInput(input: Blockly.Input, workspace: Blockly.WorkspaceSvg): void,
    getStruct(): { [key: string]: string | number | boolean | null },
}

interface StructSelectState {
    variableType: string,
    inputs: { name: string, propertyName: string, shadow: Blockly.serialization.blocks.State | null }[],
}

export class StructSelectMutator extends BlockMutator<Blockly.BlockSvg & StructSelectBlock, StructSelectState> implements StructSelectBlock {

    constructor() {
        super("struct_select_mutator")
    }

    @BlockMutator.mixin
    variableType: string = ""

    @BlockMutator.mixin
    renderedProperties: Map<string, string> = new Map()

    @BlockMutator.mixin
    updateOutputType_(this: Blockly.BlockSvg & StructSelectBlock): void {
        this.setOutput(true, this.variableType)
    }

    @BlockMutator.mixin
    showAddPropertyMenu_(this: Blockly.BlockSvg & StructSelectBlock): void {
        Blockly.DropDownDiv.setColour(
            this.style.colourPrimary,
            this.style.colourTertiary,
        );
        const menu = document.createElement("div")
        menu.className = "blocklyAutocompleteMenu"

        const type = types.utils.fromString(this.variableType)
        if (!types.utils.isStruct(type)) return

        const properties = Object.keys(type.fields).filter(it => !Array.from(this.renderedProperties.values()).includes(it))

        if (properties.length === 0) {
            return
        }

        for (const property of properties) {
            const text = document.createElement("div");
            text.textContent = property;
            text.onclick = () => {
                this.addPropertyInput_(property)
                this.hideAddPropertyMenu_()
            }
            menu.appendChild(text);
        }

        Blockly.DropDownDiv.getContentDiv().appendChild(menu)
        Blockly.DropDownDiv.showPositionedByBlock(this.getField("ADD")!, this)
    }

    @BlockMutator.mixin
    hideAddPropertyMenu_(this: Blockly.BlockSvg & StructSelectBlock): void {
        Blockly.DropDownDiv.hideIfOwner(this.getField("ADD")!, true);
    }

    @BlockMutator.mixin
    addPropertyInput_(this: Blockly.BlockSvg & StructSelectBlock, name: string, id?: string): Blockly.Input | null {
        const type = types.utils.fromString(this.variableType)
        if (!types.utils.isStruct(type)) return null

        if (id === undefined) {
            id = `PROPERTY_${Blockly.utils.idGenerator.genUid()}`
        }

        const labelId = `LABEL_${id}`

        const shadow = ShadowFactory.createShadowForType(type.fields[name])
        this.appendDummyInput(labelId).appendField(name, labelId)
        const input = this.appendValueInput(id)
            .setCheck(type.fields[name].name)
            .setShadowDom(shadow)

        this.renderedProperties.set(id, name)

        this.moveInputBefore("ADD", null) // move add to the end

        return input
    }

    @BlockMutator.mixin
    removePropertyInput_(this: Blockly.BlockSvg & StructSelectBlock, input: Blockly.Input): void {
        const name = input.name
        const label = this.inputList.find(i => i.name.startsWith("LABEL") && i.name === `LABEL_${name}`)

        if (label) this.removeInput(label.name)
        this.removeInput(name)
        this.renderedProperties.delete(name)
    }

    @BlockMutator.mixin
    getPropertyInputs(this: Blockly.BlockSvg & StructSelectBlock): Blockly.Input[] {
        return this.inputList.filter(i => i.name.startsWith("PROPERTY"))
    }

    // TODO: copied from list
    @BlockMutator.mixin
    focusInput(this: Blockly.BlockSvg & StructSelectBlock, input: Blockly.Input, workspace: Blockly.WorkspaceSvg): void {
        Blockly.WidgetDiv.hide()
        Blockly.DropDownDiv.hideWithoutAnimation()
        const targetBlock = input.connection?.targetBlock() as Blockly.BlockSvg;
        Blockly.renderManagement.finishQueuedRenders().then(() => {
            // dispatch a click on this block with the center of the next block as the position

            const metrics = targetBlock.getRelativeToSurfaceXY()
            const offset = workspace.getOriginOffsetInPixels()
            const scale = workspace.scale
            const centerX = metrics.x * scale + offset.x + targetBlock.width * scale / 2
            const centerY = metrics.y * scale + offset.y + targetBlock.height * scale / 2

            targetBlock.inputList.find(input => input.fieldRow.length > 0)?.fieldRow[0].showEditor()
            targetBlock.getSvgRoot().querySelector(".blocklyPath")?.dispatchEvent(new PointerEvent("click", {
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY,
                composed: true,
                pointerId: 1,
                view: window
            })
            )
        })
    }

    @BlockMutator.mixin
    getStruct(this: Blockly.BlockSvg & StructSelectBlock): { [key: string]: string | number | boolean | null } {
        const struct: { [key: string]: string | number | boolean | null } = {}
        for (const input of this.getPropertyInputs()) {
            const propertyName = this.renderedProperties.get(input.name)
            const value = input.connection?.targetBlock()?.getFieldValue("ENUM")
            struct[propertyName!] = value
        }

        return struct
    }

    public saveExtraState(this: Blockly.BlockSvg & StructSelectBlock): StructSelectState {
        return {
            variableType: this.variableType,
            inputs: this.inputList.filter(input => input.name.startsWith("PROPERTY")).map(input => ({
                name: input.name,
                propertyName: this.renderedProperties.get(input.name)!,
                shadow: input.connection?.targetBlock() ? Blockly.serialization.blocks.save(input.connection!.targetBlock()!) : null
            }))
        }
    }

    public loadExtraState(this: Blockly.BlockSvg & StructSelectBlock, state: StructSelectState) {
        this.variableType = state.variableType
        this.updateOutputType_()

        for (const input of state.inputs) {
            this.addPropertyInput_(input.propertyName, input.name)
        }
    }

    public domToMutation(this: Blockly.BlockSvg & StructSelectBlock, xmlElement: Element) {
        this.variableType = xmlElement.getAttribute("variableType")!

        subscribe(state => state.sourceTable, () => {
            this.updateOutputType_()
        }, { immediate: true })
    }

    public mutationToDom(this: Blockly.BlockSvg & StructSelectBlock): Element {
        const mutation = Blockly.utils.xml.createElement("mutation")
        mutation.setAttribute("variableType", this.variableType)

        return mutation
    }

    public extension(this: Blockly.BlockSvg & StructSelectBlock): void {
        this.renderedProperties = new Map()
        const icon = IconFactory.wrapIcon(IconFactory.createPlusIcon("white", 12))
        const addButton = new FieldButton(icon, { width: 12, height: 12, svg: icon });
        this.appendDummyInput("ADD").appendField(addButton, "ADD")

        addButton.addClickListener(() => {
            this.showAddPropertyMenu_()
        })

        const observers: MutationObserver[] = []

        Blockly.browserEvents.bind(this.getSvgRoot(), "click", this, (e: MouseEvent) => {
            observers.forEach(observer => observer.disconnect())
            observers.length = 0

            if (!Blockly.WidgetDiv.isVisible()) return

            Blockly.Events.disable()

            const target = e.target as Element
            let shadowBlockSvg: null | Element = target
            while (shadowBlockSvg && (shadowBlockSvg.tagName !== "g" || !shadowBlockSvg.hasAttribute("data-id"))) {
                shadowBlockSvg = shadowBlockSvg.parentElement
            }
            const input = this.inputList.find(i => i.connection?.getShadowDom()?.id === shadowBlockSvg?.getAttribute("data-id"))
            const label = this.inputList.find(i => i.name.startsWith("LABEL") && i.name === `LABEL_${input?.name}`)

            const div = Blockly.WidgetDiv.getDiv()
            if (div && input && label) {
                const labelBBox = label.fieldRow[0].getScaledBBox()
                const xPosition = labelBBox.left - 1 // we need to offset the widget by 1px to account for the padding between label and input

                div.dataset.xOffset = parseFloat(div.style.left) - xPosition + ""

                const inputElement = div.querySelector("input")!

                inputElement.addEventListener("keydown", (e) => {
                    const inputs = this.getPropertyInputs()

                    if ((e.key === "Backspace" || e.key === "Delete") && inputElement.value === "") {
                        const index = inputs.indexOf(input!)
                        let next: Blockly.Input | null = null
                        if (index !== -1) {
                            if (index > 0) {
                                next = inputs[index - 1]
                            } else {
                                next = inputs[index + 1]
                            }

                            if (next) {
                                this.focusInput(next, this.workspace)
                            }
                        }

                        Blockly.DropDownDiv.hideWithoutAnimation()
                        this.removePropertyInput_(input)
                    } else if (e.key === "ArrowLeft" && inputElement.selectionStart === 0) {
                        const index = inputs.indexOf(input!)
                        if (index > 0) {
                            this.focusInput(inputs[index - 1], this.workspace)
                        }
                    } else if (e.key === "ArrowRight" && inputElement.selectionStart === inputElement.value.length) {
                        const index = inputs.indexOf(input!)
                        if (index < inputs.length - 1) {
                            this.focusInput(inputs[index + 1], this.workspace)
                        }
                    }
                })

                const labelElement = document.createElement("div")
                labelElement.className = "px-1.5 text-white"
                labelElement.textContent = label.fieldRow[0].getText()

                const minus = document.createElement("div")
                minus.className = "pr-1 cursor-pointer h-6 flex items-center justify-center"
                minus.appendChild(IconFactory.wrapIcon(IconFactory.createMinusIcon("white", 10)))
                minus.addEventListener("click", () => {
                    Blockly.WidgetDiv.hide()
                    if (input) {
                        this.removePropertyInput_(input)
                    }
                })

                div.insertBefore(labelElement, div.firstChild)
                div.appendChild(minus)

                const observer = new MutationObserver(() => {
                    if (div.style.display === "none") {
                        // if the widget is hidden, we disconnect the observer
                        observer.disconnect()
                        delete div.dataset.xOffset
                        delete div.dataset.input
                        delete div.dataset.block
                        return
                    }

                    inputElement.style.width = div.style.width

                    observer.disconnect()
                    div.style.width = "auto"
                    div.style.left = xPosition + "px"
                    observer.observe(div, { attributes: true, attributeFilter: ["style"], attributeOldValue: true })
                })
                observers.push(observer)

                inputElement.style.width = div.style.width
                div.style.width = "auto"
                div.style.display = "flex"
                div.style.flexDirection = "row"
                div.style.gap = "2px"
                div.style.alignItems = "center"
                div.style.backgroundColor = this.getColourSecondary() ?? this.getColour()

                observer.observe(div, { attributes: true, attributeFilter: ["style"], attributeOldValue: true })

                div.dataset.input = input.name
                div.dataset.block = this.id
                // we do need to rerender the block here to make sure the input is sized according to the larger widget overlay
                this.render()
            }

            Blockly.Events.enable()
        })
    }

}
