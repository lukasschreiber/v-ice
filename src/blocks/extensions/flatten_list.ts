import * as Blockly from "blockly/core"
import types from "@/data/types"

Blockly.Extensions.register(
    "flatten_list",
    function (this: Blockly.Block) {
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
                    }
                }

            } else if (payload.oldParentId === this.id) {
                // reset the output type
                this.outputConnection?.setCheck(originalCheck ?? types.list(types.nullable(types.wildcard)).name)
            }
        })
    }
)