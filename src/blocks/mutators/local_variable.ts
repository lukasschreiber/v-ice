import * as Blockly from "blockly/core"
import types from "@/data/types"
import { FieldTypeLabel } from "../fields/field_type_label"
import { ScopedBlock, ScopedBlockExtension } from "../extensions/scoped"
import { showNotification } from "@/context/notifications/notification_emitter"
import { NotificationType } from "@/context/notifications/notification_config"
import { getAllBlocksInGraph } from "@/utils/nodes"
import { BlockMutator } from "../block_mutators"

interface LocalVariableState {
    type: string
    scope: string
}

export class LocalVariableMutator extends BlockMutator<ScopedBlock, LocalVariableState> implements ScopedBlockExtension {
    constructor() {
        super("local_variable_mutator")
    }

    @BlockMutator.mixin
    isScoped_: boolean = true

    @BlockMutator.mixin
    scope: string = ""

    @BlockMutator.mixin
    setScope(scope: string) {
        this.scope = scope
    }

    public saveExtraState(this: ScopedBlock): LocalVariableState {
        const typeLabel = this.getField("TYPE") as FieldTypeLabel
        return { type: types.utils.toString(typeLabel!.getType()!), scope: this.scope }
    }

    public loadExtraState(this: ScopedBlock, state: LocalVariableState) {
        const type = types.utils.fromString(state.type)
        this.setOutput(true, type.name)

        const typeField = this.getField("TYPE") as FieldTypeLabel
        typeField.setType(type)
        this.setScope(state.scope)
    }

    public extension(this: ScopedBlock): void {
        this.setOnChange((e) => {
            // if the block has been set
            if(e.type === Blockly.Events.BLOCK_MOVE) {
                const payload = e.toJson() as Blockly.Events.BlockMoveJson
                if (!payload.reason?.includes("drag")) return

                const block = e.getEventWorkspace_().getBlockById(payload.blockId)
                const localVariableBlock = block?.getDescendants(false).find(it => it.id === this.id)
                if (localVariableBlock) {
                    // if the block is inside of a block that has the right scope keep it, otherwise remove it
                    const scopeId = this.scope
                    let parent = localVariableBlock!.getSurroundParent()
                    while (parent && parent.id !== scopeId) {
                        parent = parent.getSurroundParent()
                    }

                    // we need to check if the block is connected to the nodelink graph, it is only sitting around we might as well keep it
                    const isInGraph = getAllBlocksInGraph(this.workspace).includes(localVariableBlock!)

                    if (!parent && isInGraph) {
                        localVariableBlock.dispose(true)
                        showNotification(Blockly.Msg.NOTIFICATION_VARIABLE_OUT_OF_SCOPE, NotificationType.LocalVariableOutOfScope)
                    }
                }
            }
        })
    }
}