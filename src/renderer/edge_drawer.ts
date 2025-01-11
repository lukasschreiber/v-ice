import { FieldEdgeConnection, NodeConnectionType } from "@/blocks/fields/field_edge_connection"
import * as  Blockly from "blockly/core"
import { store } from "@/store/store"
import { setEdgeEditMarker } from "@/store/blockly/blockly_slice"
import { getFieldFromEvent } from "@/events/utils"
import { Edge, getEdgeId } from "@/utils/edges"

export class EdgeDrawer {
    protected edge_: Edge

    protected readonly markerId_: string = "marker"
    protected readonly defaultWidth_: number = 5
    protected readonly linkRoot_: SVGGElement
    protected edgePath_: SVGPathElement | null = null
    protected pathWidth_: number = this.defaultWidth_
    protected colorClass_: string = "stroke-green-500/40"

    constructor(edge: Edge, linkRoot: SVGGElement) {
        this.edge_ = edge
        this.linkRoot_ = linkRoot

        if (this.edge_.sourceBlock && this.edge_.targetBlock && this.edge_.sourceField && this.edge_.targetField) {
            const counts = store.getState().edgeCounts.counts
            const currentCount = counts[getEdgeId(this.edge_)]
            const maxCount = Math.max(...Object.values(counts))
            const minCount = 0
            if (currentCount !== undefined && currentCount !== 0) {
                this.pathWidth_ = Math.max(5, Math.min(20, Math.round((currentCount - minCount) / (maxCount - minCount) * 20)))
                const isNegative = this.edge_.sourceField.getConnectionType() === NodeConnectionType.NEGATIVE || this.edge_.targetField.getConnectionType() === NodeConnectionType.NEGATIVE
                this.colorClass_ = isNegative ? "stroke-red-500/40" : "stroke-green-500/40"
            } else {
                this.pathWidth_ = this.defaultWidth_
                this.colorClass_ = "stroke-slate-500/20"
            }
        }
    }

    protected drawEdge_(from: {x: number, y: number}, to: {x: number, y: number}, blockId: string, connectionId: string, className: string = "") {
        if(!this.edge_.sourceField || !this.edge_.sourceBlock) return

        const controlPointXDistance = Math.min(Math.max(Math.abs(to.x - from.x), 100), 150)

        const isOriginAlignedLeft = this.edge_.sourceField.getParentInput().align === Blockly.inputs.Align.LEFT

        this.edgePath_ = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.PATH,
            {
                "data-id": blockId,
                "data-connection": connectionId,
                "class": `${className} hover:cursor-pointer`,
                "stroke-width": this.pathWidth_,
                "fill": "none",
                "d": Blockly.utils.svgPaths.moveTo(from.x, from.y) + Blockly.utils.svgPaths.curve("C", [
                    Blockly.utils.svgPaths.point(isOriginAlignedLeft ? from.x - controlPointXDistance : from.x + controlPointXDistance, from.y),
                    Blockly.utils.svgPaths.point(isOriginAlignedLeft ? to.x + controlPointXDistance : to.x - controlPointXDistance, to.y),
                    Blockly.utils.svgPaths.point(to.x, to.y),
                ])
            },
            this.linkRoot_ 
        )
    }

    drawMarker(mouseEvent: MouseEvent) {
        const origin = this.edge_.sourceField
        const workspace = this.edge_.sourceBlock?.workspace as Blockly.WorkspaceSvg | undefined

        if (origin && workspace) {
            const target = getFieldFromEvent(mouseEvent, workspace)
            this.disposeMarker()

            // solution from https://groups.google.com/g/blockly/c/LXnMujtEzJY
            const mouseXY = Blockly.browserEvents.mouseToSvg(mouseEvent, workspace.getParentSvg(), workspace.getInverseScreenCTM())
            const absoluteMetrics = workspace.getMetricsManager().getAbsoluteMetrics();

            mouseXY.x = (mouseXY.x - absoluteMetrics.left - workspace.scrollX) / workspace.scale
            mouseXY.y = (mouseXY.y - absoluteMetrics.top - workspace.scrollY) / workspace.scale

            if(target && target instanceof FieldEdgeConnection) {
                mouseXY.x = target.getEdgeXY().x
                mouseXY.y = target.getEdgeXY().y
            }

            this.drawEdge_(origin.getEdgeXY(), mouseXY, this.markerId_, this.markerId_, "stroke-slate-500/20")
        }
    }

    draw() {
        if(!this.edge_.sourceField || !this.edge_.sourceBlock) return

        if (this.edge_.sourceBlock.shouldDrawEdges() && this.edge_.targetBlock && this.edge_.targetField && this.edge_.sourceField.name) {
            const connectionId = getEdgeId(this.edge_)
            this.linkRoot_.querySelectorAll(`[data-connection="${connectionId}"]`).forEach((element) => element.remove())

            this.drawEdge_(this.edge_.sourceField.getEdgeXY(), this.edge_.targetField.getEdgeXY(), this.edge_.sourceBlock.id, connectionId, this.colorClass_)
         
            // TODO: move to gesture
            this.edgePath_!.addEventListener("click", () => {
                if(!this.edge_.sourceField || !this.edge_.sourceBlock) return

                if(this.edge_.targetBlock && this.edge_.targetField?.name && this.edge_.sourceField.name) {
                    store.dispatch(setEdgeEditMarker({
                        sourceBlockId: this.edge_.sourceBlock.id,
                        sourceName: this.edge_.sourceField.name,
                        targetBlockId: this.edge_.targetBlock.id,
                        targetName: this.edge_.targetField.name
                    }))
                }
            })

        }
    }

    disposeMarker() {
        this.linkRoot_.querySelectorAll(`[data-id="${this.markerId_}"]`).forEach((element) => element.remove())
    }
}