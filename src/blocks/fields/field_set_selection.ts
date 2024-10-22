import * as Blockly from 'blockly/core';

interface FieldSetSelectionFromJsonConfig extends Blockly.FieldConfig {
    selected: SetSelectionType[];
}

export enum SetSelectionType {
    INTERSECTION = "INTERSECTION",
    RIGHT_EXCLUSIVE = "RIGHT_EXCLUSIVE",
    LEFT_EXCLUSIVE = "LEFT_EXCLUSIVE",
    NEITHER = "NEITHER"
}

export class FieldSetSelection extends Blockly.Field {
    override SERIALIZABLE = true;

    protected readonly parameters = {
        radius: 32,
        padding: 5,
        cornerRadius: 5,
        overlapPercentage: 0.15625, // could actually be anything, this value correspoods to 5/32
        borderColor: "#aaaa",
        backgroundColor: "#fff",
        selectedColor: "#aaa"
    }

    protected readonly selected: Set<SetSelectionType> = new Set();
    protected setSelectionElement_: SVGGElement | null = null
    protected innerLineLeft_: SVGPathElement | null = null
    protected innerLineRight_: SVGPathElement | null = null
    protected outline_: SVGPathElement | null = null
    protected intersection_: SVGPathElement | null = null
    protected leftSemicircle_: SVGPathElement | null = null
    protected rightSemicircle_: SVGPathElement | null = null
    protected neither_: SVGPathElement | null = null
    
    protected readonly mouseEvents_: Array<Blockly.browserEvents.Data> = []

    constructor(selected: SetSelectionType[]) {
        super(selected.join(","));
        this.selected = new Set(selected);
    }

    protected override initView(): void {
        this.updateSize_();
        this.createSetSelectionElement_()
    }

    protected override render_() {
        super.render_();
        this.applyColors_();
    }

    protected applyColors_() {
        this.intersection_!.setAttribute("fill", this.selected.has(SetSelectionType.INTERSECTION) ? this.parameters.selectedColor : this.parameters.backgroundColor);
        this.leftSemicircle_!.setAttribute("fill", this.selected.has(SetSelectionType.LEFT_EXCLUSIVE) ? this.parameters.selectedColor : this.parameters.backgroundColor);
        this.rightSemicircle_!.setAttribute("fill", this.selected.has(SetSelectionType.RIGHT_EXCLUSIVE) ? this.parameters.selectedColor : this.parameters.backgroundColor);
        this.neither_!.setAttribute("fill", this.selected.has(SetSelectionType.NEITHER) ? this.parameters.selectedColor : this.parameters.backgroundColor);
    
        if(this.selected.has(SetSelectionType.INTERSECTION) && this.selected.has(SetSelectionType.LEFT_EXCLUSIVE)) {
            this.innerLineLeft_!.setAttribute("stroke", this.parameters.backgroundColor);
        } else {
            this.innerLineLeft_!.setAttribute("stroke", this.parameters.borderColor);
        }

        if(this.selected.has(SetSelectionType.INTERSECTION) && this.selected.has(SetSelectionType.RIGHT_EXCLUSIVE)) {
            this.innerLineRight_!.setAttribute("stroke", this.parameters.backgroundColor);
        } else {
            this.innerLineRight_!.setAttribute("stroke", this.parameters.borderColor);
        }

        if(this.selected.has(SetSelectionType.NEITHER)) {
            this.outline_!.setAttribute("stroke", this.parameters.backgroundColor);
        } else {
            this.outline_!.setAttribute("stroke", this.parameters.borderColor);
        }
    }

    getSelection() {
        return Array.from(this.selected);
    }

    protected createSetSelectionElement_() {
        const radius = this.parameters.radius;
        const topOffset = this.parameters.padding + this.parameters.overlapPercentage * radius;
        const bottomOffset = this.parameters.padding + 2 * radius - this.parameters.overlapPercentage * radius;
        const horizontalCenter = this.size_.width / 2;

        const constants = this.getConstants();
        if(!constants) return

        this.setSelectionElement_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.G, {}, this.fieldGroup_)

        this.neither_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.RECT, {
            rx: this.parameters.cornerRadius,
            ry: this.parameters.cornerRadius,
            x: 0,
            y: 0,
            width: this.size_.width,
            height: this.size_.height,
            fill: this.parameters.backgroundColor,
            class: "cursor-pointer",
        }, this.setSelectionElement_)

        // left semicircle
        this.leftSemicircle_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.PATH, {
            d: Blockly.utils.svgPaths.moveTo(horizontalCenter, topOffset)
                + Blockly.utils.svgPaths.arc("A", "90 1 0", radius, Blockly.utils.svgPaths.point(horizontalCenter, bottomOffset))
                + Blockly.utils.svgPaths.moveTo(horizontalCenter, topOffset)
                + Blockly.utils.svgPaths.arc("A", "90 0 0", radius, Blockly.utils.svgPaths.point(horizontalCenter, bottomOffset)),
            "fill-rule": "evenodd",
            class: "cursor-pointer",
        }, this.setSelectionElement_)

        // right semicircle
        this.rightSemicircle_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.PATH, {
            d: Blockly.utils.svgPaths.moveTo(horizontalCenter, topOffset)
                + Blockly.utils.svgPaths.arc("A", "90 1 1", radius, Blockly.utils.svgPaths.point(horizontalCenter, bottomOffset))
                + Blockly.utils.svgPaths.moveTo(horizontalCenter, topOffset)
                + Blockly.utils.svgPaths.arc("A", "90 0 1", radius, Blockly.utils.svgPaths.point(horizontalCenter, bottomOffset)),
            "fill-rule": "evenodd",
            class: "cursor-pointer",
        }, this.setSelectionElement_)

        // intersection
        this.intersection_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.PATH, {
            d: Blockly.utils.svgPaths.moveTo(horizontalCenter, topOffset)
                + Blockly.utils.svgPaths.arc("A", "90 0 0", radius, Blockly.utils.svgPaths.point(horizontalCenter, bottomOffset))
                + Blockly.utils.svgPaths.moveTo(horizontalCenter, topOffset)
                + Blockly.utils.svgPaths.arc("A", "90 0 1", radius, Blockly.utils.svgPaths.point(horizontalCenter, bottomOffset)),
            "fill-rule": "evenodd",
            class: "cursor-pointer",
        }, this.setSelectionElement_)

        // rect oultine for NEITHER
        Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.RECT, {
            rx: this.parameters.cornerRadius,
            ry: this.parameters.cornerRadius,
            x: 0,
            y: 0,
            width: this.size_.width,
            height: this.size_.height,
            fill: "none",
            stroke: this.parameters.borderColor,
        }, this.setSelectionElement_)

        // outline
        this.outline_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.PATH, {
            d: Blockly.utils.svgPaths.moveTo(horizontalCenter, topOffset)
                + Blockly.utils.svgPaths.arc("A", "90 1 0", radius, Blockly.utils.svgPaths.point(horizontalCenter, bottomOffset))
                + Blockly.utils.svgPaths.moveTo(horizontalCenter, topOffset)
                + Blockly.utils.svgPaths.arc("A", "90 1 1", radius, Blockly.utils.svgPaths.point(horizontalCenter, bottomOffset)),
            fill: "none",
            stroke: this.parameters.borderColor,
        }, this.setSelectionElement_)

        // innerLine left
        this.innerLineLeft_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.PATH, {
            d: Blockly.utils.svgPaths.moveTo(horizontalCenter, topOffset)
                + Blockly.utils.svgPaths.arc("A", "90 0 0", radius, Blockly.utils.svgPaths.point(horizontalCenter, bottomOffset)),
            fill: "none",
            stroke: this.parameters.borderColor,
        }, this.setSelectionElement_)

        // innerLine right
        this.innerLineRight_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.PATH, {
            d: Blockly.utils.svgPaths.moveTo(horizontalCenter, topOffset)
                + Blockly.utils.svgPaths.arc("A", "90 0 1", radius, Blockly.utils.svgPaths.point(horizontalCenter, bottomOffset)),
            fill: "none",
            stroke: this.parameters.borderColor,
        }, this.setSelectionElement_)
    }

    protected override bindEvents_(): void {
        if(this.sourceBlock_?.isInFlyout) return;
        this.intersection_!.addEventListener("click", this.onIntersectionClick_.bind(this));
        this.leftSemicircle_!.addEventListener("click", this.onLeftSemicircleClick_.bind(this));
        this.rightSemicircle_!.addEventListener("click", this.onRightSemicircleClick_.bind(this));
        this.neither_!.addEventListener("click", this.onNeitherClick_.bind(this));
    }

    private onIntersectionClick_() {
        if(this.selected.has(SetSelectionType.INTERSECTION)) {
            this.selected.delete(SetSelectionType.INTERSECTION);
        } else {
            this.selected.add(SetSelectionType.INTERSECTION);
        }
        this.forceRerender();
    }

    private onLeftSemicircleClick_() {
        if(this.selected.has(SetSelectionType.LEFT_EXCLUSIVE)) {
            this.selected.delete(SetSelectionType.LEFT_EXCLUSIVE);
        } else {
            this.selected.add(SetSelectionType.LEFT_EXCLUSIVE);
        }
        this.forceRerender();
    }

    private onRightSemicircleClick_() {
        if(this.selected.has(SetSelectionType.RIGHT_EXCLUSIVE)) {
            this.selected.delete(SetSelectionType.RIGHT_EXCLUSIVE);
        } else {
            this.selected.add(SetSelectionType.RIGHT_EXCLUSIVE);
        }
        this.forceRerender();
    }

    private onNeitherClick_() {
        if(this.selected.has(SetSelectionType.NEITHER)) {
            this.selected.delete(SetSelectionType.NEITHER);
        } else {
            this.selected.add(SetSelectionType.NEITHER);
        }
        this.forceRerender();
    }

    protected updateSize_() {
        this.size_.height = this.parameters.radius * 2 + this.parameters.padding * 2;
        this.size_.width = this.parameters.radius * 4 + this.parameters.padding * 2 - (this.parameters.overlapPercentage * this.parameters.radius * 4);
    }

    static fromJson(options: FieldSetSelectionFromJsonConfig) {
        return new FieldSetSelection(options.selected);
    }
}

Blockly.fieldRegistry.register('field_set_selection', FieldSetSelection);