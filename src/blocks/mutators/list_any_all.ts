import * as Blockly from 'blockly';
import { subscribe } from '@/store/subscribe';
import { Blocks } from '@/blocks';
import types from '@/data/types';
import { FieldLocalVariable } from '../fields/field_local_variable';
import { ConstantProvider } from '@/renderer/constants';
import { FieldTypeLabel } from '../fields/field_type_label';
import { showNotification } from '@/store/notifications/notification_emitter';
import { NotificationType } from '@/store/notifications/notification_config';

export interface ListAnyAllBlock extends Blockly.BlockSvg {
    variableType: string,
    updateType(): void,
    getAllLocalVariablesForScope(): string[]
}

interface ListAnyAllState {
    variableType: string,
}

const listAnyAllMixin: Partial<ListAnyAllBlock> = {
    saveExtraState: function (this: ListAnyAllBlock) {
        return {
            variableType: this.variableType,
        }
    },
    loadExtraState: function (this: ListAnyAllBlock, state: ListAnyAllState) {
        this.variableType = state.variableType
        this.updateType()
    },
    domToMutation: function (this: ListAnyAllBlock, xmlElement: Element) {
        this.variableType = xmlElement.getAttribute("variableType")!

        subscribe(state => state.data.source, () => {
            this.updateType()
        }, { immediate: true })
    },
    mutationToDom: function (this: ListAnyAllBlock) {
        const mutation = Blockly.utils.xml.createElement("mutation")
        mutation.setAttribute("variableType", this.variableType)
        return mutation
    },
    getAllLocalVariablesForScope(this: ListAnyAllBlock) {
        const workspace = this.workspace
        const variables: string[] = []
        workspace.getAllBlocks().forEach(block => {
            if (Blocks.Types.isScopedBlock(block) && block.scope === this.id) {
                variables.push(block.id)
            }
        })

        return variables
    },
    updateType: function (this: ListAnyAllBlock) {
        // console.log("set type", this.variableType, this.getInput("LIST")?.connection?.targetConnection?.getCheck(), this.getInput("LIST")?.connection?.isConnected())
        const connectedBlock = this.getInput("LIST")?.connection?.targetBlock()
        if (connectedBlock) {
            const type = connectedBlock.outputConnection?.getCheck()?.[0]
            if (type) {
                const list = types.utils.fromString(type)
                let disposedBlocks = 0
                if (types.utils.isList(list)) {
                    (this.getField("VALUE") as FieldLocalVariable).setType(list.elementType);

                    this.getAllLocalVariablesForScope().forEach(id => {
                        const local = this.workspace.getBlockById(id)
                        const constants = this.workspace.getRenderer().getConstants() as ConstantProvider

                        // if the local variable is connected to a list, we update the type
                        if (local) {
                            // console.log(local.type)
                            const oldParentBlock = local.outputConnection.targetBlock()
                            const oldParentInput = oldParentBlock?.inputList.find(input => input.connection === local.outputConnection.targetConnection)

                            if (oldParentInput && oldParentInput.connection && Blocks.Types.isDynamicInputBlock(oldParentBlock)) {
                                oldParentInput.connection.setCheck(oldParentBlock.originalTypes[oldParentInput.name].name)
                                const success = oldParentBlock.setType(oldParentInput.name, list.elementType, true)

                                local.setOutputShape(constants.shapeForType(list.elementType)?.type ?? 0)
                                const typeLabel = local.getField("TYPE") as FieldTypeLabel
                                typeLabel.setType(list.elementType)

                                if (!success) {
                                    local.dispose(true)
                                    disposedBlocks++
                                }
                            }
                        }
                    })
                }

                if (disposedBlocks > 0) {
                    if (disposedBlocks === 1) {
                        showNotification("Eine lokale Variable wurde entfernt, da sie nach dem Ändern des Typs nicht mehr kompatibel war.", NotificationType.LocalVariableDisposed)
                    } else {
                        showNotification(`${disposedBlocks} lokale Variablen wurden entfernt, da sie nach dem Ändern des Typs nicht mehr kompatibel waren.`, NotificationType.LocalVariableDisposed)
                    }
                }
            }
        }
    },

}

function listAnyAllHelper(this: ListAnyAllBlock) {
    this.setOnChange((event) => {
        if (event.getEventWorkspace_().isFlyout) return
        Blockly.Events.setRecordUndo(false)

        if (event.type === Blockly.Events.BLOCK_MOVE) {
            const payload = event.toJson() as Blockly.Events.BlockMoveJson
            if (payload.newParentId !== this.id) return

            if (payload.reason?.includes("connect")) {
                this.variableType = this.getInput("LIST")?.connection?.targetConnection?.getCheck()?.[0] ?? ""
                this.updateType()
            }
        }

        if (event.type === Blockly.Events.BLOCK_CHANGE) {
            const payload = event.toJson() as Blockly.Events.BlockChangeJson
            const block = event.getEventWorkspace_().getBlockById(payload.blockId)
            if (block && (block.type === Blocks.Names.VARIABLE.GET_COLUMN)) {
                this.variableType = this.getInput("LIST")?.connection?.targetConnection?.getCheck()?.[0] ?? ""
                this.updateType()
            }
        }
        Blockly.Events.setRecordUndo(true)
    })
}

Blockly.Extensions.registerMutator(
    'list_any_all_mutator',
    listAnyAllMixin,
    listAnyAllHelper
);

