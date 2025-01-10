import * as Blockly from 'blockly';
import { arraysAreEquivalent } from '@/utils/array';
import types, { IStructType, StructFields } from '@/data/types';
import { FieldDynamicDropdown } from '../fields/field_dynamic_dropdown';
import { Blocks } from '@/blocks';
import { ListAnyAllBlock } from './list_any_all';
import { BlockMutator } from '../block_mutators';

export interface StructPropertySelectBlock {
    variableType: string,
    selectedProperty: string,
    update_(): void,
}

interface StructPropertySelectState {
    variableType: string,
    selectedProperty: string,
}

export class StructPropertySelectMutator extends BlockMutator<Blockly.Block & StructPropertySelectBlock, StructPropertySelectState> implements StructPropertySelectBlock {

    constructor() {
        super("struct_property_select_mutator")
    }

    @BlockMutator.mixin
    variableType: string = ""

    @BlockMutator.mixin
    selectedProperty: string = ""

    @BlockMutator.mixin
    update_(this: Blockly.Block & StructPropertySelectBlock): void {
        if (!this.variableType) return
        const type = types.utils.fromString(this.variableType)
        if (!types.utils.isStruct(type) && !(types.utils.isList(type) && types.utils.isStruct(type.elementType))) return

        const struct: IStructType<StructFields> = types.utils.isList(type) ? type.elementType as IStructType<StructFields> : type as IStructType<StructFields>

        const dropdown = this.getField("PROPERTY") as FieldDynamicDropdown | null
        if (!dropdown) return

        dropdown.updateOptions(() => {
            const options = Object.keys(struct.fields)
            return options.length >= 1 ? options.map(it => [it, it]) : [["", ""]]
        })

        const property = this.getFieldValue("PROPERTY")
        const propertyType = struct.fields[property]
        if (propertyType) {
            const outputType = types.utils.isList(type) ? types.list(propertyType) : propertyType

            if (this.outputConnection?.isConnected()) {
                const parent = this.outputConnection?.targetBlock()
                const parentInput = this.outputConnection?.targetConnection?.getParentInput()
                if (parent && parentInput && Blocks.Types.isDynamicInputBlock(parent)) {
                    // only update if the parent type is not already compatible
                    parent.setType(parentInput.name, outputType, true)
                }
                this.setOutput(true, outputType.name)
            } else {
                this.setOutput(true, outputType.name)
            }
        }
    }

    public saveExtraState(this: Blockly.Block & StructPropertySelectBlock): StructPropertySelectState {
        return {
            variableType: this.variableType,
            selectedProperty: this.getFieldValue("PROPERTY")
        }
    }

    public loadExtraState(this: Blockly.Block & StructPropertySelectBlock, state: StructPropertySelectState): void {
        this.variableType = state.variableType

        if (this.variableType) {
            // TODO: Code duplication, see below, this was a quick fix, I am sorry
            const type = types.utils.fromString(this.variableType)
            if (!types.utils.isStruct(type) && !(types.utils.isList(type) && types.utils.isStruct(type.elementType))) return

            const struct: IStructType<StructFields> = types.utils.isList(type) ? type.elementType as IStructType<StructFields> : type as IStructType<StructFields>

            const dropdown = this.getField("PROPERTY") as FieldDynamicDropdown | null
            if (!dropdown) return

            dropdown.updateOptions(() => {
                const options = Object.keys(struct.fields)
                return options.length >= 1 ? options.map(it => [it, it]) : [["", ""]]
            })
        }

        this.setFieldValue(state.selectedProperty, "PROPERTY")
        this.update_()
    }

    public extension(this: Blockly.Block & StructPropertySelectBlock): void {
        let lastChildren: string[] = []

        this.update_()

        this.setOnChange((event) => {
            if (event.type === Blockly.Events.MOVE && !event.getEventWorkspace_().isFlyout) {
                const payload = event.toJson() as Blockly.Events.BlockMoveJson
                if (!(payload.reason?.includes("connect") || payload.reason?.includes("disconnect"))) return

                const children = this.getChildren(true).filter(child => child.outputConnection) // we are only interested in children that are inside of the block
                const childrenNames = children.map(it => it.type + "/" + (it.outputConnection?.getCheck()?.[0] ?? "null"))

                if (arraysAreEquivalent(childrenNames, lastChildren)) return

                lastChildren = childrenNames
                const typeString = this.getInput("STRUCT")?.connection?.targetBlock()?.outputConnection?.getCheck()
                if (typeString) {
                    this.variableType = typeString[0]
                    this.update_()
                }

            } else if (event.type === Blockly.Events.CHANGE) {
                const payload = event.toJson() as Blockly.Events.BlockChangeJson
                if (payload.name !== "PROPERTY") return

                // set the outputtype based on the property
                const type = types.utils.fromString(this.variableType)
                if (!types.utils.isStruct(type) && !(types.utils.isList(type) && types.utils.isStruct(type.elementType))) return

                const struct: IStructType<StructFields> = types.utils.isList(type) ? type.elementType as IStructType<StructFields> : type as IStructType<StructFields>
                const property = this.getFieldValue("PROPERTY")
                const propertyType = struct.fields[property]
                if (!propertyType) return
                // TODO: Code duplication, see above
                const outputType = types.utils.isList(type) ? types.list(propertyType) : propertyType
                if (this.outputConnection?.isConnected()) {
                    const parent = this.outputConnection?.targetBlock()
                    const parentInput = this.outputConnection?.targetConnection?.getParentInput()
                    if (parent && parentInput && Blocks.Types.isDynamicInputBlock(parent)) {
                        parent.setType(parentInput.name, outputType, true)
                    }
                    this.setOutput(true, outputType.name)

                    if (parent && parent.type === Blocks.Names.LIST.ANY_ALL) {
                        const listBlock = parent as unknown as ListAnyAllBlock
                        listBlock.variableType = outputType.name
                        listBlock.updateType()
                    }
                } else {
                    this.setOutput(true, outputType.name)
                }
            }
        })
    }
}
