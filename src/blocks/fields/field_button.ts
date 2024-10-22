import * as Blockly from "blockly/core" 

export class FieldButton extends Blockly.FieldLabel {
    private svg_: SVGSVGElement
    private svgWrapper_: SVGGElement
    private svgClickReceiver_: SVGRectElement

    private width_: number
    private height_: number
    private boundEvents_: Blockly.browserEvents.Data[] = []

    constructor(svg: SVGSVGElement, config: FieldButtonConfig) {
        super("", config.class, config)

        this.svgWrapper_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.G, {}, null)
        this.svgClickReceiver_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.RECT, {
            x: 0,
            y: 0,
            width: config.width,
            height: config.height,
            fill: "transparent"
        }, null)

        this.svg_ = svg
        this.width_ = config.width
        this.height_ = config.height

        this.svgWrapper_.appendChild(svg)
        this.svgWrapper_.appendChild(this.svgClickReceiver_)

        this.svgWrapper_.style.pointerEvents = "bounding-box"
        this.svgWrapper_.style.cursor = "pointer"
        this.svgWrapper_.style.position = "relative"

        // we need to set the size of the svg to width and height
        this.svgWrapper_.setAttribute("width", config.width.toString())
        this.svgWrapper_.setAttribute("height", config.height.toString())

        this.centerSvg();
    }

    private centerSvg() {
        const bbox = this.svg_.getBBox();
        const width = bbox.width || this.width_;
        const height = bbox.height || this.height_;
        
        // Set the viewBox to match the calculated or provided dimensions
        this.svg_.setAttribute("width", width.toString());
        this.svg_.setAttribute("height", height.toString());
        this.svg_.setAttribute("preserveAspectRatio", "xMidYMid meet");

        // Center the svg within the wrapper using transform
        const translateX = (this.width_ - width) / 2;
        const translateY = (this.height_ - height) / 2;
        this.svg_.style.transform = `translate(${translateX}px, ${translateY}px)`;
    }

    showEditor_() {
        // noop
    }

    initView(): void {
        // noop, we don't want to add the textelement
    }

    updateSize_() {
        this.size_.width = this.width_
        this.size_.height = this.height_
    }

    render_() {
        this.getSvgRoot()?.appendChild(this.svgWrapper_)
        this.updateSize_()
        super.render_()
    }

    addClickListener(clickHandler: (e: MouseEvent) => void) {
        this.boundEvents_.push(Blockly.browserEvents.conditionalBind(this.svgClickReceiver_, "click", this, clickHandler))
    }

    dispose() {
        this.boundEvents_.forEach(event => Blockly.browserEvents.unbind(event))
        super.dispose()
    }

    static fromJson(options: FieldButtonConfig): FieldButton {
        return new this(options.svg, options)
    }
}

export interface FieldButtonConfig extends Blockly.FieldLabelConfig {
    svg: SVGSVGElement
    width: number
    height: number
}


Blockly.fieldRegistry.register("field_button", FieldButton)