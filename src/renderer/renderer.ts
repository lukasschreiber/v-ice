import * as Blockly from "blockly/core"
import { Drawer } from "@/renderer/drawer";
import { ConstantProvider } from "@/renderer/constants";
import { RenderInfo } from "@/renderer/info";
import { EdgeDrawer } from "./edge_drawer";

import { FieldEdgeConnection } from "@/blocks/fields/field_edge_connection";
import { Blocks } from "@/blocks";
import { PathObject } from "./path_object";
import { Edge } from "@/utils/edges";
import { NodeBlock } from "@/blocks/extensions/node";
import { warn } from "@/utils/logger";

export class Renderer extends Blockly.zelos.Renderer {
    constructor() {
        super("renderer");
    }

    override createDom(svg: SVGElement, theme: Blockly.Theme): void {
        super.createDom(svg, theme)
        // this creates the DOM using the constant provider, here filters etc. are added
        // the actual workspace is added in the inject function using the LayerManager. We can add a new Layer here, this way we do not need to manipulate Blockly Code directly.

        const linkCanvasSvgGroup = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.G,
            {
                class: "blocklyLinkCanvas"
            },
        )

        svg.querySelector(".blocklyLinkCanvas")?.remove()
        svg.querySelector(".blocklyBlockCanvas")?.append(linkCanvasSvgGroup)

        this.linkSvgRoot_ = linkCanvasSvgGroup
    }

    protected linkSvgRoot_: SVGGElement | null = null

    getLinkSvgRoot() {
        return this.linkSvgRoot_
    }

    protected override makeConstants_(): ConstantProvider {
        return new ConstantProvider()
    }

    protected override makeRenderInfo_(block: Blockly.BlockSvg): RenderInfo {
        return new RenderInfo(this, block)
    }

    protected override makeDrawer_(block: Blockly.BlockSvg, info: RenderInfo): Blockly.zelos.Drawer {
        return new Drawer(block, info)
    }

    override makePathObject(root: SVGElement, style: Blockly.Theme.BlockStyle): Blockly.zelos.PathObject {
        return new PathObject(root, style, this.constants_)
    }

    makeBlockDrawer(block: Blockly.BlockSvg): Drawer {
        const info = this.makeRenderInfo_(block);
        info.measure();
        return new Drawer(block, info)
    }

    makeEdgeDrawer(edge: Edge): EdgeDrawer {
        return new EdgeDrawer(edge, this.linkSvgRoot_!)
    }

    disposeEdgeDrawer(): void {
        new EdgeDrawer({} as Edge, this.linkSvgRoot_!).disposeMarker()
    }

    override render(block: Blockly.BlockSvg, opt_include_edge_offset: boolean = false): void {
        const info = this.makeRenderInfo_(block);
        info.measure();
        this.makeDrawer_(block, info).draw();
        if (Blocks.Types.isNodeBlock(block) && block.shouldDrawEdges()) {
            this.renderEdges(block, opt_include_edge_offset)
        }
    }

    renderEdges(block: Blockly.BlockSvg & NodeBlock, includeOffset: boolean = false): void {
        this.linkSvgRoot_!.querySelectorAll(`[data-id="${block.id}"]`).forEach((element) => element.remove())
        // FIXME: currently connections are drawn two times and only updated on either side
        const connections = block.edgeConnections
        for (const [fieldName, connectionObj] of connections) {
            for (const connection of connectionObj.connections) {
                const targetBlock = connection.targetBlock()
                if (connection.isConnected() && Blocks.Types.isNodeBlock(targetBlock)) {
                    this.makeEdgeDrawer({
                        sourceBlock: block,
                        sourceField: block.getField(fieldName) as FieldEdgeConnection,
                        targetBlock: targetBlock,
                        targetField: targetBlock.getField([...targetBlock.edgeConnections.entries()].find(([, value]) => value.connections.includes(connection.targetConnection!))![0]) as FieldEdgeConnection,
                    }).draw(includeOffset)
                }
            }
        }
    }
}

try {
    Blockly.blockRendering.register(Renderer.name, Renderer);
} catch (e) {
    warn("Renderer has already been registered").log();
}