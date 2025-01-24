import * as Blockly from 'blockly';
import { subscribe } from '@/store/subscribe';
import { Blocks } from '@/blocks';
import types from '@/data/types';
import { FieldLocalVariable } from '../fields/field_local_variable';
import { ConstantProvider } from '@/renderer/constants';
import { FieldTypeLabel } from '../fields/field_type_label';
import { showNotification } from '@/context/notifications/notification_emitter';
import { NotificationType } from '@/context/notifications/notification_config';
import { BlockMutator } from '../block_mutators';

export interface ListAnyAllBlock {
    variableType: string,
    updateType(): void,
    getAllLocalVariablesForScope(): string[]
}

interface ListAnyAllState {
    variableType: string,
}

export class ListAnyAllMutator extends BlockMutator<Blockly.BlockSvg & ListAnyAllBlock, ListAnyAllState> implements ListAnyAllBlock {

    constructor() {
        super("list_any_all_mutator")
    }

    @BlockMutator.mixin
    variableType: string = ""

    @BlockMutator.mixin
    updateType(this: Blockly.BlockSvg & ListAnyAllBlock): void {
        // console.log("set type", this.variableType, this.getInput("LIST")?.connection?.targetConnection?.getCheck(), this.getInput("LIST")?.connection?.isConnected())
        const connectedBlock = this.getInput("LIST")?.connection?.targetBlock()
        if (!connectedBlock) return

        const type = connectedBlock.outputConnection?.getCheck()?.[0]
        if (!type) return

        const list = types.utils.fromString(type)
        if (!types.utils.isList(list)) return

        let disposedBlocks = 0;
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


        if (disposedBlocks === 1) {
            showNotification("Eine lokale Variable wurde entfernt, da sie nach dem Ändern des Typs nicht mehr kompatibel war.", NotificationType.LocalVariableDisposed)
        } else if (disposedBlocks > 1) {
            showNotification(`${disposedBlocks} lokale Variablen wurden entfernt, da sie nach dem Ändern des Typs nicht mehr kompatibel waren.`, NotificationType.LocalVariableDisposed)
        }
    }

    @BlockMutator.mixin
    getAllLocalVariablesForScope(this: Blockly.BlockSvg & ListAnyAllBlock): string[] {
        const workspace = this.workspace
        const variables: string[] = []
        workspace.getAllBlocks().forEach(block => {
            if (Blocks.Types.isScopedBlock(block) && block.scope === this.id) {
                variables.push(block.id)
            }
        })

        return variables
    }

    public saveExtraState(this: Blockly.BlockSvg & ListAnyAllBlock): ListAnyAllState {
        return {
            variableType: this.variableType,
        }
    }

    public loadExtraState(this: Blockly.BlockSvg & ListAnyAllBlock, state: ListAnyAllState) {
        this.variableType = state.variableType
        this.updateType()
    }

    public domToMutation(this: Blockly.BlockSvg & ListAnyAllBlock, xmlElement: Element) {
        this.variableType = xmlElement.getAttribute("variableType")!

        subscribe(state => state.sourceTable, () => {
            this.updateType()
        }, { immediate: true })
    }

    public mutationToDom(this: Blockly.BlockSvg & ListAnyAllBlock): Element {
        const mutation = Blockly.utils.xml.createElement("mutation")
        mutation.setAttribute("variableType", this.variableType)
        return mutation
    }

    public extension(this: Blockly.BlockSvg & ListAnyAllBlock): void {
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
}
