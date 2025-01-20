import * as Blockly from "blockly/core"
import { Gesture } from "@/gesture"
import { FieldLabelTargetNode } from "./blocks/fields/field_label_target_node"
import { Blocks } from "./blocks"
import { Renderer } from "./renderer/renderer"
import { BlockSvg } from "./block_svg"
import { Block } from "./block"
import { EvaluationAction, triggerAction } from "./evaluation_emitter"
import { ToolboxInfo } from "blockly/core/utils/toolbox"

/**
 * If a node block is removed we need to remove all connections that are connected to it
 * doing this in any event handler is not possible as the block is already removed
 */
const removeBlockById = Blockly.WorkspaceSvg.prototype.removeBlockById
Blockly.WorkspaceSvg.prototype.removeBlockById = function (id: string) {
    Blockly.Events.setGroup(true)
    const block = this.getBlockById(id)
    if (Blocks.Types.isNodeBlock(block)) {
        block.deleteEdges()
    }

    removeBlockById.call(this, id)

    this.getSvgGroup().querySelector(".blocklyLinkCanvas")?.querySelectorAll(`[data-id="${id}"]`).forEach((element) => element.remove())
    Blockly.Events.setGroup(false)
}

/**
 * This is needed to make sure that the custom category is registered with the workspace if the workspace is not initialized with these categories
 * TODO: check if isHidden needs to be checked here as well
 */
const updateToolbox = Blockly.WorkspaceSvg.prototype.updateToolbox
Blockly.WorkspaceSvg.prototype.updateToolbox = function (toolboxDefinition: Blockly.utils.toolbox.ToolboxDefinition | null) {
    if (toolboxDefinition && toolboxDefinition.hasOwnProperty("contents")) {
        (toolboxDefinition as ToolboxInfo).contents.map((category) => {
            if (category.hasOwnProperty("custom")) {
                const customCategory = category as Blockly.utils.toolbox.DynamicCategoryInfo & { register?: (workspace: Blockly.WorkspaceSvg) => void }
                customCategory.register?.call(this, this)
            }
            return category
        })
    }
    updateToolbox.call(this, toolboxDefinition)
}

/**
 * this is the exact code from https://github.com/google/blockly/blob/e2df0fc2885cb994886c0af863035f50bb849948/core/workspace_svg.ts#L2480
 * we use this to inject a custom Gesture class which makes gestures and therefore pointeractions customizable without further monkeypatching
 * this works very well as this is the only place where an instance of Gesture is created
 * 
 * TODO: the gesture class could actually be injected as a plugin in Blockly.inject as it is only created once here. This would require an upstream PR
 */
Blockly.WorkspaceSvg.prototype.getGesture = function (e: PointerEvent) {
    const isStart = e.type === 'pointerdown';

    const gesture = this.currentGesture_ as Gesture | null;
    if (gesture) {
        if (isStart && gesture.hasStarted() && !gesture.isDraggingEdge()) {
            console.warn('Tried to start the same gesture twice.');
            // That's funny.  We must have missed a mouse up.
            // Cancel it, rather than try to retrieve all of the state we need.
            gesture.cancel();
            return null;
        }
        return gesture;
    }

    // No gesture existed on this workspace, but this looks like the start of a
    // new gesture.
    if (isStart) {
        this.currentGesture_ = new Gesture(e, this);
        return this.currentGesture_;
    }
    // No gesture existed and this event couldn't be the start of a new gesture.
    return null;
}

// TODO: move this to a more appropriate place and use it in the flyout
export function isTargetNodeCapacityAvailable(workspace: Blockly.Workspace, data: Blockly.Block | Blockly.serialization.blocks.State) {
    if (data.type === Blocks.Names.NODE.TARGET) {
        if (data instanceof Blockly.Block) {
            const block = data as Blockly.Block
            return (workspace.getBlocksByType(Blocks.Names.NODE.TARGET).find(b => (b.getField("LABEL") as FieldLabelTargetNode).getId() === (block!.getField("LABEL") as FieldLabelTargetNode).getId()) === undefined)
        } else {
            const state = data as Blockly.serialization.blocks.State
            return (workspace.getBlocksByType(Blocks.Names.NODE.TARGET).find(b => (b.getField("LABEL") as FieldLabelTargetNode).getId() === state.fields?.["LABEL"]?.["id"]) === undefined)
        }
    }
    return true
}

/**
 * This is a monkeypatch to prevent the user from pasting a target node block that already exists
 */
const paste = Blockly.clipboard.BlockPaster.prototype.paste
Blockly.clipboard.BlockPaster.prototype.paste = function (copyData, workspace, coordinate?) {
    if (!isTargetNodeCapacityAvailable(workspace, copyData.blockState)) return null
    triggerAction(EvaluationAction.CopyBlock, { blockType: copyData.blockState.type })

    if (copyData.blockState.type === Blocks.Names.LIST.ANY_ALL || copyData.blockState.type === Blocks.Names.TIMELINE.EVENT_OCCURS_MATCH) {
        const newBlock = paste.call(this, copyData, workspace, coordinate)

        if (newBlock) {
            // we need to get all local variables in the scope of the new block and update them accordingly
            const newName = newBlock.getFieldValue("VALUE")
            const newId = newBlock.id

            // find all local_variables that are descendants of the new block
            const query = newBlock.getInput("QUERY")?.connection?.targetBlock()
            const children = query?.getDescendants(false) || []

            for (const child of children) {
                if (child.type === Blocks.Names.VARIABLE.LOCAL_GET && Blocks.Types.isScopedBlock(child)) {
                    child.scope = newId
                    child.setFieldValue(newName, "LABEL")
                }
            }
        }

        return newBlock
    } else {
        return paste.call(this, copyData, workspace, coordinate)
    }
}

/**
 * If a move event is undone we need to rerender the edges of the block
 */
const eventBlockMoveRun = Blockly.Events.BlockMove.prototype.run
Blockly.Events.BlockMove.prototype.run = function (forward: boolean) {
    eventBlockMoveRun.call(this, forward)
    if (this.blockId) {
        const workspace = this.getEventWorkspace_() as Blockly.WorkspaceSvg
        const renderer = workspace.getRenderer() as Renderer
        const block = workspace.getBlockById(this.blockId)
        if (block && Blocks.Types.isNodeBlock(block)) {
            renderer.renderEdges(block)
        }
    }
}

const updateFieldEditable = Blockly.Field.prototype.updateEditable
Blockly.Field.prototype.updateEditable = function (this: Blockly.Field) {
    updateFieldEditable.call(this)
    const group = this.fieldGroup_
    if (!group) return
    if (this.hasOwnProperty("menuGenerator_")) {
        Blockly.utils.dom.addClass(group, "blocklyEditableDropdownText")
    } else {
        Blockly.utils.dom.removeClass(group, "blocklyEditableDropdownText")
    }
    if (this.hasOwnProperty("htmlInput_")) {
        Blockly.utils.dom.addClass(group, "blocklyEditableInputText")
    } else {
        Blockly.utils.dom.removeClass(group, "blocklyEditableInputText")
    }
}

Blockly.WorkspaceSvg.prototype.newBlock = function (type: string, id?: string) {
    return new BlockSvg(this, type, id)
}

Blockly.Workspace.prototype.newBlock = function (type: string, id?: string) {
    return new Block(this, type, id)
}