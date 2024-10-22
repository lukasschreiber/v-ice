import * as Blockly from "blockly/core"
import t, { IType } from "@/data/types"
import { arraysAreEquivalent } from "@/utils/array"
import { ShadowFactory } from "../shadow_factory"

export interface DynamicInputBlock extends Blockly.Block {
    updateShape_(inputName: string, type: IType, opt_updateChildOutputType?: boolean): void,
    inputTypes: Record<string, IType>,
    originalTypes: Record<string, IType>,
    setType(inputName: string, type: IType, opt_updateChildOutputType?: boolean): boolean
}

interface DynamicInputState {
    inputTypes: Record<string, string>,
    originalTypes: Record<string, string>
}

const dynamicInputTypeMixin: Partial<DynamicInputBlock> = {
    saveExtraState: function (this: DynamicInputBlock) {
        return {
            inputTypes: Object.entries(this.inputTypes).reduce((acc, [name, type]) => {
                if (type) acc[name] = type.name
                return acc
            }, {} as Record<string, string>),
            originalTypes: Object.entries(this.originalTypes).reduce((acc, [name, type]) => {
                if (type) acc[name] = type.name
                return acc
            }, {} as Record<string, string>)
        }
    },
    loadExtraState: function (this: DynamicInputBlock, state: DynamicInputState) {
        Object.entries(state.originalTypes).forEach(([name, originalType]) => {
            this.updateShape_(name, t.utils.fromString(originalType))
        })
    },
    originalTypes: {},
    inputTypes: {},
    updateShape_: function (this: DynamicInputBlock, inputName: string, type: IType, opt_updateChildOutputType: boolean = false) {
        const input = this.getInput(inputName)
        if (!input) return
    
        if (ShadowFactory.addShadowToInput(input, type, opt_updateChildOutputType)) {
            this.inputTypes[inputName] = type
        }
    },
    setType: function (this: DynamicInputBlock, inputName: string, type: IType, opt_updateChildOutputType: boolean = false) {
        const referenceType = this.originalTypes[inputName]
        let inferredType: IType | null = null
        try {
            inferredType = t.utils.inferAbstractType(referenceType, type)
        } catch (e) {
            return false
        }

        if (inferredType === null) return false

        this.inputList.forEach(input => {
            if (!input.connection) return
            console.log(input.name)
            const check = this.originalTypes[input.name].name
            this.updateShape_(input.name, t.utils.replaceAbstractType(t.utils.fromString(check), inferredType!), opt_updateChildOutputType)
        })

        return true
    }
};


const dynamicInputTypeExtension = function (this: DynamicInputBlock) {
    this.originalTypes = {}
    for (const input of this.inputList) {
        const check = input.connection?.getCheck()?.[0] ?? null
        this.originalTypes[input.name] = check ? t.utils.fromString(check) : t.wildcard
    }

    let lastChildren: string[] = []

    this.setOnChange((event) => {
        if (event.type !== Blockly.Events.MOVE || event.getEventWorkspace_().isFlyout) return
        const reason = (event.toJson() as Blockly.Events.BlockMoveJson).reason
        if (!(reason?.includes("connect") || reason?.includes("disconnect"))) return
        const children = this.getChildren(true).filter(child => child.outputConnection) // we are only interested in children that are inside of the block
        const childrenNames = children.map(it => it.type + "/" + (it.outputConnection?.getCheck()?.[0] ?? "null"))
        if (!arraysAreEquivalent(childrenNames, lastChildren)) {
            lastChildren = childrenNames

            const referenceChild = children.find(child => child.outputConnection?.isConnected() && !child.isShadow())
            if (!referenceChild) {
                if (children.every(child => child.isShadow())) {
                    this.inputList.forEach(input => {
                        if (!input.connection) return
                        const type = this.originalTypes[input.name]
                        this.inputTypes[input.name] = type
                        input.setCheck(type.name)
                    })
                }
                return
            }

            const check = referenceChild.outputConnection?.getCheck()?.[0]
            const referenceInput = this.inputList.find(input => input.connection?.targetBlock() === referenceChild)

            if (check && referenceInput) {
                const type = t.utils.fromString(check)
                this.setType(referenceInput.name, type)
            }
        }
    })
};

Blockly.Extensions.registerMutator(
    'dynamic_input_types',
    dynamicInputTypeMixin,
    dynamicInputTypeExtension,
);