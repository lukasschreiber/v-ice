import * as Blockly from "blockly/core"
import types, { IEventType, IIntervalType, IType, StructFields } from "@/data/types"
import { Blocks } from "@/blocks"
import { FieldVariable } from "../fields/field_variable"
import { FieldLocalVariable } from "../fields/field_local_variable"
import { FieldTypeLabel } from "../fields/field_type_label"
import { ConstantProvider } from "@/renderer/constants"
import { StructPropertySelectBlock } from "../mutators/struct_property_select"

function updateVariables(block: Blockly.BlockSvg) {
    let timelineMatchBlock: Blockly.Block | null = block.getSurroundParent()
    while (timelineMatchBlock && timelineMatchBlock?.type !== Blocks.Names.TIMELINE.QUERY && timelineMatchBlock.getSurroundParent()) {
        timelineMatchBlock = timelineMatchBlock.getSurroundParent()
    }

    const timelineInput = timelineMatchBlock?.getInput("TIMELINE")
    const timelineTypeString = (timelineInput?.connection?.targetBlock()?.getField("VAR") as FieldVariable | null)?.getVariable()?.type
    if (timelineTypeString) {
        const timelineType = types.utils.fromString(timelineTypeString)
        if (!types.utils.isTimeline(timelineType)) return

        const isEvent = block.getField("SUBJECT")?.getValue() === "EVENT"

        let type: IType | null = null
        const elementTypes = types.utils.isUnion(timelineType.elementType) ? timelineType.elementType.types : [timelineType.elementType]

        if (isEvent) {
            const eventTypes = elementTypes.filter(type => types.utils.isEvent(type))

            if (!eventTypes) return

            type = eventTypes.length === 1 ? eventTypes[0] : types.union(...eventTypes as [IEventType<StructFields>, IEventType<StructFields>])
        } else {
            const intervalTypes = elementTypes.filter(type => types.utils.isInterval(type))
            if (!intervalTypes) return

            type = intervalTypes.length === 1 ? intervalTypes[0] : types.union(...intervalTypes as [IIntervalType<StructFields>, IIntervalType<StructFields>])
        }

        const localVariableField = block.getField("VALUE") as FieldLocalVariable
        localVariableField.setType(type)

        // update the type of all local variables connected to this block
        const workspace = block.workspace
        const constants = block.workspace.getRenderer().getConstants() as ConstantProvider
        const variables: Blockly.BlockSvg[] = []
        workspace.getAllBlocks().forEach(b => {
            if (Blocks.Types.isScopedBlock(b) && b.scope === block.id) {
                variables.push(b)
            }
        })

        variables.forEach(variable => {
            if (!type) return

            const oldParentBlock = variable.outputConnection.targetBlock()
            const oldParentInput = oldParentBlock?.inputList.find(input => input.connection === variable.outputConnection.targetConnection)
            if (oldParentInput && oldParentInput.connection) {
                
                const name = localVariableField.getValue()

                if (Blocks.Types.isDynamicInputBlock(oldParentBlock)) {
                    oldParentInput.connection.setCheck(oldParentBlock.originalTypes[oldParentInput.name].name)
                    const success = oldParentBlock.setType(oldParentInput.name, type, true)

                    variable.setOutput(true, type.name)
                    variable.setOutputShape(constants.shapeForType(type)?.type ?? 0)
                    const typeLabel = variable.getField("TYPE") as FieldTypeLabel
                    typeLabel.setType(type)
                    variable.setFieldValue(name, "LABEL")

                    if (!success) {
                        variable.dispose(true)
                    }
                } else if (oldParentBlock?.type === Blocks.Names.STRUCTS.GET_PROPERTY) {
                    const propertySelectBlock = oldParentBlock as StructPropertySelectBlock
                    propertySelectBlock.variableType = type.name
                    propertySelectBlock.update_()

                    // duplication but currently I don't care enough to refactor this
                    variable.setOutput(true, type.name)
                    variable.setOutputShape(constants.shapeForType(type)?.type ?? 0)
                    const typeLabel = variable.getField("TYPE") as FieldTypeLabel
                    typeLabel.setType(type)
                    variable.setFieldValue(name, "LABEL")
                }
            }
        })
    } else {
        resetVariables(block)
    }
}

function resetVariables(block: Blockly.BlockSvg, newValue_?: string) {
    const newValue = newValue_ || block.getField("SUBJECT")?.getValue()

    let type: IType | null = null
    let name = "Event"
    const localVariableField = block.getField("VALUE") as FieldLocalVariable

    if (newValue === "EVENT") {
        name = Blockly.Msg["EVENT"]
        type = types.event(types.enum(types.wildcard))
    } else {
        name = "%{BKY_INTERVAL}"
        type = types.interval(types.enum(types.wildcard))
    }

    localVariableField.setValue(localVariableField.generateUniqueName(Blockly.utils.parsing.replaceMessageReferences(name)))
    localVariableField.setType(type)

    const workspace = block.workspace
    const constants = block.workspace.getRenderer().getConstants() as ConstantProvider
    const variables: Blockly.BlockSvg[] = []
    workspace.getAllBlocks().forEach(b => {
        if (Blocks.Types.isScopedBlock(b) && b.scope === block.id) {
            variables.push(b)
        }
    })

    variables.forEach(block => {
        if (!type) return

        const oldParentBlock = block.outputConnection.targetBlock()
        const oldParentInput = oldParentBlock?.inputList.find(input => input.connection === block.outputConnection.targetConnection)

        if (oldParentInput && oldParentInput.connection && (Blocks.Types.isDynamicInputBlock(oldParentBlock) || oldParentBlock?.type === Blocks.Names.STRUCTS.GET_PROPERTY)) {
            let success = true

            if (Blocks.Types.isDynamicInputBlock(oldParentBlock)) {
                oldParentInput.connection.setCheck(oldParentBlock.originalTypes[oldParentInput.name].name)
                success = oldParentBlock.setType(oldParentInput.name, type, true)
            } else if (oldParentBlock?.type === Blocks.Names.STRUCTS.GET_PROPERTY) {
                const propertySelectBlock = oldParentBlock as StructPropertySelectBlock
                propertySelectBlock.variableType = type.name
                propertySelectBlock.update_()
            }
            
            block.setOutput(true, type.name)
            block.setOutputShape(constants.shapeForType(type)?.type ?? 0)
            block.setFieldValue(localVariableField.getValue(), "LABEL")
            const typeLabel = block.getField("TYPE") as FieldTypeLabel
            typeLabel.setType(type)

            if (!success) {
                block.dispose(true)
            }
        }
    })
}

Blockly.Extensions.register(
    "dynamic_event_matches",
    function (this: Blockly.BlockSvg) {
        this.setOnChange((event) => {

            if (event.type === Blockly.Events.CHANGE) {
                const payload = event.toJson() as Blockly.Events.BlockChangeJson
                if (payload.blockId === this.id && payload.name === "SUBJECT") {
                    // resetVariables(this, payload.newValue as string)
                    updateVariables(this)
                }

            }

            if (event.type !== Blockly.Events.MOVE || event.getEventWorkspace_().isFlyout) return
            const payload = event.toJson() as Blockly.Events.BlockMoveJson
            if (!(payload.reason?.includes("connect") || payload.reason?.includes("disconnect"))) return

            const surroundParents = []

            let block = this.getSurroundParent()
            while (block) {
                surroundParents.push(block)
                block = block.getSurroundParent()
            }

            if (payload.blockId === this.id || surroundParents.some(block => block.id === payload.blockId || block.id === payload.newParentId || block.id === payload.oldParentId)) {
                updateVariables(this)
            }
        })
    }
)