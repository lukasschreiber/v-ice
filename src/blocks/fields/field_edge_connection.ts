import * as Blockly from "blockly/core"
import { TypedField } from "./field"

export enum NodeConnectionType { INPUT, OUTPUT, POSITIVE, NEGATIVE }

interface FieldEdgeConnectionConfig extends Blockly.FieldConfig {
    text: string
    connectionType: NodeConnectionType
}

export class FieldEdgeConnection extends Blockly.Field implements TypedField {
    protected options_: FieldEdgeConnectionConfig
    protected connectionDotElement_: SVGElement | null = null

    /** The connection dot position with respects to the field */
    private connectionDotOffset_: Blockly.utils.Coordinate | null = null

    override SERIALIZABLE = true;

    constructor(options: FieldEdgeConnectionConfig) {
        super(Blockly.utils.parsing.replaceMessageReferences(options.text))
        this.options_ = options
    }

    static fromJson(options: FieldEdgeConnectionConfig) {
        return new FieldEdgeConnection(options)
    }

    getEdgeXY(): Blockly.utils.Coordinate {
        const offset = this.getConnectionDotOffset()
        return this.getRelativeToSurfaceXY().translate(offset.x, offset.y)
    }

    getConnectionDotOffset(): Blockly.utils.Coordinate {
        return this.connectionDotOffset_ ?? new Blockly.utils.Coordinate(0, 0)
    }

    getConnectionType(): NodeConnectionType {
        return this.options_.connectionType
    }

    getOutputType() {
        return null
    }

    /**
     * Implementation taken from blockly/core/block_svg.ts L347 ff
     * 
     * Return the coordinates of the top-left corner of this block relative to the
     * drawing surface's origin (0,0), in workspace units.
     * If the block is on the workspace, (0, 0) is the origin of the workspace
     * coordinate system.
     * This does not change with workspace scale.
     *
     * @returns Object with .x and .y properties in workspace coordinates.
     */
    getRelativeToSurfaceXY(): Blockly.utils.Coordinate {
        const layerManger = (this.getSourceBlock()?.workspace as Blockly.WorkspaceSvg).getLayerManager();
        if (!layerManger) {
            throw new Error(
                'Cannot calculate position because the workspace has not been appended',
            );
        }
        let x = 0;
        let y = 0;

        let element: SVGElement = this.getSvgRoot()!;
        if (element) {
            do {
                // Loop through this block and every parent.
                const xy = Blockly.utils.svgMath.getRelativeXY(element);
                x += xy.x;
                y += xy.y;
                element = element.parentNode as SVGElement;
            } while (element && !layerManger.hasLayer(element));
        }
        return new Blockly.utils.Coordinate(x, y);
    }

    protected override render_(): void {
        this.textElement_!.style.fontSize = "9pt"
        this.textContent_!.nodeValue = this.getDisplayText_()
        this.updateSize_()
    }

    protected override initView(): void {
        // createBorderRect creates a white background, currently not used, but will be in the future, although not in white
        this.createHoverTextElement_()

        const align = this.options_.connectionType === NodeConnectionType.INPUT ? Blockly.inputs.Align.LEFT : Blockly.inputs.Align.RIGHT
        this.getParentInput().align = align

        this.createConnectionDotElement_(align)

        if (this.fieldGroup_) {
            Blockly.utils.dom.addClass(this.fieldGroup_, 'cursor-pointer group/fieldEdegConnection')
            this.fieldGroup_.style.pointerEvents = "bounding-box"
        }
    }

    protected createHoverTextElement_() {
        this.textElement_ = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.TEXT,
            {
                class: 'blocklyText group-hover/fieldEdegConnection:!fill-workspace-connectionpoint-hover !cursor-pointer',
            },
            this.fieldGroup_,
        )
        if (this.getConstants()!.FIELD_TEXT_BASELINE_CENTER) {
            this.textElement_.setAttribute('dominant-baseline', 'central')
        }
        this.textContent_ = document.createTextNode('')
        this.textElement_.appendChild(this.textContent_)
    }

    protected createConnectionDotElement_(align: Blockly.inputs.Align) {
        if (align === Blockly.inputs.Align.CENTRE) throw ("Connection dot cannot be drawn in the center!")

        const sourceBlockSvg = this.getSourceBlock() as Blockly.BlockSvg
        const x = align === Blockly.inputs.Align.LEFT ? -this.constants_!.MEDIUM_PADDING : this.getSize().width + this.constants_!.MEDIUM_PADDING
        const y = this.getSize().height / 2
        this.connectionDotOffset_ = new Blockly.utils.Coordinate(x, y)
        this.connectionDotElement_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.CIRCLE, {
            cx: x,
            cy: y,
            r: 4,
            fill: sourceBlockSvg.style.colourPrimary,
            stroke: sourceBlockSvg.style.colourTertiary,
        }, this.fieldGroup_)
    }

    protected override updateSize_(): void {
        const constants = this.getConstants();
        const xOffset = 0;
        let totalWidth = xOffset * 2;
        const totalHeight = 16;

        let contentWidth = 0;
        if (this.textElement_) {
            contentWidth = Blockly.utils.dom.getFastTextWidth(
                this.textElement_,
                9,
                constants!.FIELD_TEXT_FONTWEIGHT,
                constants!.FIELD_TEXT_FONTFAMILY,
            );
            totalWidth += contentWidth;
        }

        this.size_.height = totalHeight;
        this.size_.width = totalWidth;

        this.positionTextElement_(xOffset, contentWidth);
        this.positionBorderRect_();
    }
}

Blockly.fieldRegistry.register('field_edge_connection', FieldEdgeConnection);
