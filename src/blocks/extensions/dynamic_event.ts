import * as Blockly from "blockly/core"
import types from "@/data/types"
import { TypeChecker } from "@/data/type_checker"
import { Blocks } from "@/blocks"
import { FieldVariable } from "../fields/field_variable"
import { ShadowFactory } from "../shadow_factory"

Blockly.Extensions.register(
    "dynamic_event",
    function (this: Blockly.Block) {
        this.setOnChange((event) => {
            if (event.type !== Blockly.Events.MOVE || event.getEventWorkspace_().isFlyout) return
            const payload = event.toJson() as Blockly.Events.BlockMoveJson
            if (!(payload.reason?.includes("connect") || payload.reason?.includes("disconnect"))) return

            if (payload.blockId === this.id || payload.newParentId === this.getSurroundParent()?.id) {
                let timelineMatchBlock: Blockly.Block | null = this.getSurroundParent()
                while (timelineMatchBlock && timelineMatchBlock?.type !== Blocks.Names.TIMELINE.QUERY && timelineMatchBlock.getSurroundParent()) {
                    timelineMatchBlock = timelineMatchBlock.getSurroundParent()
                }

                const eventInputs = this.inputList.filter(input => {
                    const check = input.connection?.getCheck()
                    if (!check) return false
                    try {
                        return TypeChecker.checkTypeCompatibility(types.utils.fromString(check[0]), types.event(types.enum(types.wildcard)))
                    } catch (e) {
                        return false
                    }
                })

                if (eventInputs.length === 0) return

                for (const input of eventInputs) {
                    if (payload.reason?.includes("disconnect")) {
                        input.setShadowDom(null)
                    } else {
                        const timelineInput = timelineMatchBlock?.getInput("TIMELINE")
                        const timelineTypeString = (timelineInput?.connection?.targetBlock()?.getField("VAR") as FieldVariable | null)?.getVariable()?.type
                        if (timelineTypeString) {
                            const timelineType= types.utils.fromString(timelineTypeString)
                            if (!types.utils.isTimeline(timelineType)) return

                            const elementTypes = types.utils.isUnion(timelineType.elementType) ? timelineType.elementType.types : [timelineType.elementType]
                            const eventType = elementTypes.find(type => types.utils.isEvent(type))

                            if (!eventType) return

                            input.setShadowDom(ShadowFactory.createShadowForType(eventType))
                        }

                    }
                }
            }
        })
    }
)