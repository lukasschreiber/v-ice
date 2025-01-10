import * as Blockly from 'blockly';
import { subscribe } from '@/store/subscribe';
import types from '@/data/types';
import { ShadowFactory } from '../shadow_factory';
import { FieldButton } from '../fields/field_button';
import { IconFactory } from '../icon_factory';
import { BlockMutator } from '../block_mutators';

export interface ListSelectBlock {
    variableType: string,
    updateOutputType_(): void,
    addListElementInput_(id?: string): Blockly.Input | null,
    getListElementInputCount_(): number,
    getListElementInputs_(): Blockly.Input[],
    removeListElementInput_(input: Blockly.Input): void,
    focusInput(input: Blockly.Input, workspace: Blockly.WorkspaceSvg): void,
}

interface ListSelectState {
    variableType: string,
    inputs: { name: string, shadow: Blockly.serialization.blocks.State | null }[],
}

export class ListSelectMutator extends BlockMutator<Blockly.BlockSvg & ListSelectBlock, ListSelectState> implements ListSelectBlock {

    constructor() {
        super("list_select_mutator")
    }

    @BlockMutator.mixin
    variableType: string = ""

    @BlockMutator.mixin
    updateOutputType_(this: Blockly.BlockSvg & ListSelectBlock) {
        this.setOutput(true, this.variableType)
    }

    @BlockMutator.mixin
    addListElementInput_(this: Blockly.BlockSvg & ListSelectBlock, id?: string) {
        const type = types.utils.fromString(this.variableType)
        if (!types.utils.isList(type)) return null

        if (id === undefined) {
            id = `VALUE_${Blockly.utils.idGenerator.genUid()}`
        }

        const shadow = ShadowFactory.createShadowForType(type.elementType)
        const input = this.appendValueInput(id)
            .setCheck(type.elementType.name)
            .setShadowDom(shadow)

        this.moveInputBefore("ADD", null) // move add to the end

        return input
    }

    @BlockMutator.mixin
    removeListElementInput_(this: Blockly.BlockSvg & ListSelectBlock, input: Blockly.Input) {
        this.removeInput(input.name)
    }

    @BlockMutator.mixin
    getListElementInputCount_(this: Blockly.BlockSvg & ListSelectBlock) {
        return this.inputList.filter(input => input.name.startsWith("VALUE")).length
    }

    @BlockMutator.mixin
    getListElementInputs_(this: Blockly.BlockSvg & ListSelectBlock) {
        return this.inputList.filter(input => input.name.startsWith("VALUE"))
    }

    @BlockMutator.mixin
    focusInput(input: Blockly.Input, workspace: Blockly.WorkspaceSvg) {
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
            }))
        })
    }


    public saveExtraState(this: Blockly.BlockSvg & ListSelectBlock): ListSelectState {
        return {
            variableType: this.variableType,
            inputs: this.inputList.filter(input => input.name.startsWith("VALUE")).map(input => ({
                name: input.name,
                shadow: input.connection?.targetBlock() ? Blockly.serialization.blocks.save(input.connection!.targetBlock()!) : null
            }))
        }
    }

    public loadExtraState(this: Blockly.BlockSvg & ListSelectBlock, state: ListSelectState) {
        this.variableType = state.variableType
        this.updateOutputType_()

        for (const input of state.inputs) {
            this.addListElementInput_(input.name)
        }
    }

    public domToMutation(this: Blockly.BlockSvg & ListSelectBlock, xmlElement: Element) {
        this.variableType = xmlElement.getAttribute("variableType")!

        const values = Array.from(xmlElement.children).filter(it => it.tagName === "value")
        if (values.length > 0) {
            values.forEach((value) => {
                this.addListElementInput_(value.getAttribute("name") ?? undefined)
            })
        } else {
            this.addListElementInput_()
        }

        subscribe(state => state.data.source, () => {
            this.updateOutputType_()
        }, { immediate: true })
    }

    public mutationToDom(this: Blockly.BlockSvg & ListSelectBlock) {
        const mutation = Blockly.utils.xml.createElement("mutation")
        mutation.setAttribute("variableType", this.variableType)

        for (const input of this.inputList) {
            if (input.name.startsWith("VALUE")) {
                const value = Blockly.utils.xml.createElement("value")
                value.setAttribute("name", input.name)
                mutation.appendChild(value)
            }
        }

        return mutation
    }

    public extension(this: Blockly.BlockSvg & ListSelectBlock): void {
        const icon = IconFactory.wrapIcon(IconFactory.createPlusIcon("white", 12))
        const addButton = new FieldButton(icon, { width: 12, height: 12, svg: icon });
        this.appendDummyInput("ADD").appendField(addButton, "ADD")

        addButton.addClickListener(() => {
            this.addListElementInput_()
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
            const input = this.inputList.find(input => input.connection?.getShadowDom()?.id === shadowBlockSvg?.getAttribute("data-id"))

            const div = Blockly.WidgetDiv.getDiv()
            if (div && input) {
                const inputElement = div.querySelector("input")!

                inputElement.addEventListener("keydown", (e) => {
                    const inputs = this.getListElementInputs_()

                    if (e.key === "Tab") {
                        // if the user presses tab, we want to move the focus to the next input or creaste a new one if it is the last one
                        const index = inputs.indexOf(input!)
                        if (index !== -1) {
                            let next: Blockly.Input | null = inputs[index + 1]
                            if (index === inputs.length - 1) {
                                next = this.addListElementInput_()
                            }

                            if (next) {
                                this.focusInput(next, this.workspace)
                            }
                        }
                    } else if ((e.key === "Backspace" || e.key === "Delete") && inputElement.value === "" && inputs.length > 1) {
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

                        this.removeListElementInput_(input)
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

                if (this.getListElementInputCount_() > 1) {
                    const minus = document.createElement("div")
                    minus.className = "pr-1 cursor-pointer h-6 flex items-center justify-center"
                    minus.appendChild(IconFactory.wrapIcon(IconFactory.createMinusIcon("white", 10)))
                    minus.addEventListener("click", () => {
                        Blockly.WidgetDiv.hide()
                        if (input) {
                            this.removeListElementInput_(input)
                        }
                    })
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
            }

            Blockly.Events.enable()
        })
    }
}

