import types, { IType } from "@/data/types"
import * as Blockly from "blockly/core"
import { IconFactory } from "../icon_factory"

export interface FieldTypeLabelFromJsonConfig extends Blockly.FieldLabelFromJsonConfig {
    iconType?: IType
}

export interface FieldTypeLabelState {
    type: string | undefined
}

export class FieldTypeLabel extends Blockly.FieldLabelSerializable {
    protected type_: IType | undefined = undefined
    protected iconGroup_: SVGGElement | null = null

    constructor(type?: IType, textClass?: string, config?: Blockly.FieldLabelConfig) {
        super(undefined, textClass, config);
        this.type_ = type
    }

    initView(): void {
        this.createIconGroup_()
        this.updateIcon_()
    }

    getType() {
        return this.type_
    }

    setType(type: IType) {
        this.type_ = type
        this.updateIcon_()
    }

    createIconGroup_() {
        this.iconGroup_ = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.G, {}, this.fieldGroup_)
    }

    updateIcon_() {
        if (this.type_ && this.fieldGroup_) {
            this.iconGroup_?.childNodes.forEach(it => it.remove())
            const icon = IconFactory.createIconForType(this.type_, (this.sourceBlock_ as Blockly.BlockSvg).style.colourTertiary, (this.sourceBlock_ as Blockly.BlockSvg).style.colourPrimary)
            if (icon) this.iconGroup_?.appendChild(icon)
        }
        this.updateSize_()
    }

    override getScaledBBox(): Blockly.utils.Rect {
        const block = this.getSourceBlock();
        if (!block) {
            throw new Blockly.UnattachedFieldError();
        }

        const bBox = this.iconGroup_!.getBoundingClientRect();
        const xy = Blockly.utils.style.getPageOffset(this.iconGroup_!);
        const scaledWidth = bBox.width;
        const scaledHeight = bBox.height;
        return new Blockly.utils.Rect(xy.y, xy.y + scaledHeight, xy.x, xy.x + scaledWidth);
    }

    protected override updateSize_() {
        const constants = this.getConstants();
        let totalWidth = 0;
        let totalHeight = constants!.FIELD_TEXT_HEIGHT;

        let contentWidth = 0;
        if (this.iconGroup_) {
            const bBox = this.iconGroup_.getBBox();
            contentWidth = bBox.width === 0 ? 12 : bBox.width; // TODO: 12 only works for some icons, not for lists for example, the bBox is 0 after serialization
            totalWidth += contentWidth;
            totalHeight = bBox.height === 0 ? 12 : bBox.height;
        }

        // funnily enough, this is needed to prevent the field from being rerendered because of legacy fun
        if(totalWidth === 0) totalWidth = 1

        this.size_.height = totalHeight;
        this.size_.width = totalWidth;
    }

    override saveState(): FieldTypeLabelState {
        return {
            type: this.type_?.name,
        }
    }

    override loadState(state: FieldTypeLabelState): void {
        if (state.type) this.type_ = types.utils.fromString(state.type)
        this.updateIcon_()
    }

    static override fromJson(options: FieldTypeLabelFromJsonConfig): FieldTypeLabel {
        return new this(options.iconType, undefined, options)
    }
}

Blockly.fieldRegistry.register('field_type_label', FieldTypeLabel);