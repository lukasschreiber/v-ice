import * as Blockly from "blockly/core"
import types from "@/data/types"
import { BlockExtension } from "@/blocks/block_extensions"

export interface FlattenListBlock {
    variableType : string
}

export class FlattenListExtension extends BlockExtension<Blockly.Block> implements FlattenListBlock {
    constructor() {
        super("flatten_list")
    }

    @BlockExtension.mixin
    variableType: string = ""

    extension(this: Blockly.Block & FlattenListBlock) {
        const originalCheck = this.getInput("LIST")?.connection?.getCheck()
        this.setOnChange((event) => {
            if (event.type !== Blockly.Events.MOVE || event.getEventWorkspace_().isFlyout) return
            const payload = event.toJson() as Blockly.Events.BlockMoveJson
            if (!(payload.reason?.includes("connect") || payload.reason?.includes("disconnect"))) return

            if (payload.newParentId === this.id) {
               // set the output type to the type of the list elements
                const listTypeString = this.getInput("LIST")?.connection?.targetConnection?.getCheck()?.[0]
                if (listTypeString) {
                    const listType = types.utils.fromString(listTypeString)
                    if (types.utils.isList(listType)) {
                        this.outputConnection?.setCheck(listType.elementType.name)
                        this.variableType = listType.elementType.name
                    }
                }

            } else if (payload.oldParentId === this.id) {
                // reset the output type
                const outputType = originalCheck ?? types.list(types.nullable(types.wildcard)).name
                this.outputConnection?.setCheck(outputType)
                this.variableType = Array.isArray(outputType) ? outputType[0] : outputType
            }
        })
    }
}