import { Blocks } from "@/blocks";
import { IType } from "@/data/types";
import { ConstantProvider } from "@/renderer/constants";
import * as Blockly from "blockly/core"
import { FieldTypeLabel } from "./field_type_label";
import { Renderer } from "@/renderer/renderer";
import { TypedField } from "./field";

export interface FieldLocalVariableFromJsonConfig extends Blockly.FieldLabelFromJsonConfig {
    shapeType: IType
}

export class FieldLocalVariable extends Blockly.FieldLabelSerializable implements TypedField {
    protected shapeType_: IType | undefined = undefined
    protected blockPreview_: SVGGElement | undefined = undefined
    protected blockPreviewTarget_: Blockly.BlockSvg | undefined = undefined

    constructor(value: string, type: IType, textClass?: string, config?: Blockly.FieldLabelConfig) {
        super(Blockly.utils.parsing.replaceMessageReferences(value), textClass, config);
        this.shapeType_ = type;
    }

    getType(): IType {
        return this.shapeType_!;
    }

    setType(type: IType) {
        this.shapeType_ = type;
        this.createBlockPreview_();
        this.forceRerender();
    }

    getOutputType(): IType {
        return this.shapeType_!;
    }

    override initView(): void {
        this.value_ = this.generateUniqueName(this.value_);
        this.createBlockPreview_();
    }

    generateUniqueName(value: string | null): string | null {
        const workspace = this.sourceBlock_?.workspace as Blockly.WorkspaceSvg | undefined;
        if (!workspace || !value) return null;

        const existingNames = workspace.getAllVariableNames()
        workspace.getBlocksByType(this.getSourceBlock()!.type).forEach(block => {
            if (!block.isInFlyout && block.id !== this.sourceBlock_?.id) existingNames.push(block.getFieldValue("VALUE"))
        })

        if (!existingNames.includes(value)) return value
        const baseName = value.replace(/[0-9]+$/, "")
        let index = 2
        while (existingNames.includes(value)) {
            value = `${baseName}${index}`
            index++
        }
        return value
    }

    protected override render_(): void {
        this.addBlockPreview_();
        super.render_();
    }

    protected addBlockPreview_() {
        if (this.blockPreviewTarget_) {
            this.blockPreview_ = this.blockPreviewTarget_.getSvgRoot().cloneNode(true) as SVGGElement;
            this.blockPreview_.removeAttribute("data-id") // we use data-id to identify blocks so leaving the data-id could cause problems
            this.fieldGroup_!.appendChild(this.blockPreview_);

            this.blockPreviewTarget_.dispose()
            this.blockPreviewTarget_ = undefined
        }
    }

    protected createBlockPreview_(): void {
        const workspace = this.sourceBlock_?.workspace as Blockly.WorkspaceSvg | undefined;
        if (!workspace || !this.shapeType_) return;

        if (this.blockPreview_) {
            this.fieldGroup_!.removeChild(this.blockPreview_);
            this.blockPreview_ = undefined
        }

        Blockly.Events.disable();
        Blockly.Events.setRecordUndo(false);

        this.blockPreviewTarget_ = workspace.newBlock(Blocks.Names.VARIABLE.LOCAL_GET);
        this.blockPreviewTarget_.setFieldValue(this.value_, "LABEL");
        this.blockPreviewTarget_.setOutput(true, this.shapeType_!.name);
        (this.blockPreviewTarget_.getField("TYPE") as FieldTypeLabel).setType(this.shapeType_);
        this.blockPreviewTarget_.setMovable(false);
        this.blockPreviewTarget_.setDeletable(false);
        this.blockPreviewTarget_.initSvg();

        const renderer = workspace.getRenderer() as Renderer
        const drawer = renderer.makeBlockDrawer(this.blockPreviewTarget_);
        drawer.draw();
        this.addBlockPreview_();

        Blockly.Events.enable();
        Blockly.Events.setRecordUndo(true);
    }

    createBlock(e: PointerEvent): Blockly.BlockSvg | null {
        const workspace = this.sourceBlock_?.workspace as Blockly.WorkspaceSvg | undefined;
        if (!workspace) return null;

        const constants = this.getConstants() as ConstantProvider;

        const newBlock = workspace.newBlock(Blocks.Names.VARIABLE.LOCAL_GET)
        if (Blocks.Types.isScopedBlock(newBlock)) {
            newBlock.setFieldValue(this.value_, "LABEL")
            newBlock.setOutputShape(constants.shapeForType(this.shapeType_!)?.type ?? 0)
            newBlock.setOutput(true, this.shapeType_!.name)
            newBlock.setScope(this.sourceBlock_!.id)
            newBlock.initSvg()
            newBlock.render()

            const typeLabel = newBlock.getField("TYPE") as FieldTypeLabel
            typeLabel.setType(this.shapeType_!)

            const fieldBB = this.getScaledBBox()
            const mouseXY = Blockly.browserEvents.mouseToSvg(e, workspace.getParentSvg(), workspace.getInverseScreenCTM())
            const absoluteMetrics = workspace.getMetricsManager().getAbsoluteMetrics();
            const workspaceMetrics = workspace.getParentSvg().getBoundingClientRect();
            mouseXY.x = (mouseXY.x + (fieldBB.left - mouseXY.x) - absoluteMetrics.left - workspaceMetrics.left - workspace.scrollX) / workspace.scale
            mouseXY.y = (mouseXY.y + (fieldBB.top - mouseXY.y) - absoluteMetrics.top - workspaceMetrics.top - workspace.scrollY) / workspace.scale
            newBlock.moveBy(mouseXY.x, mouseXY.y)
            return newBlock
        }

        return null
    }

    getScaledBBox(): Blockly.utils.Rect {
        const block = this.getSourceBlock();
        if (!block) {
            throw new Blockly.UnattachedFieldError();
        }

        const bBox = this.blockPreview_!.getBoundingClientRect();
        const xy = Blockly.utils.style.getPageOffset(this.blockPreview_!);
        const scaledWidth = bBox.width;
        const scaledHeight = bBox.height;
        return new Blockly.utils.Rect(xy.y, xy.y + scaledHeight, xy.x, xy.x + scaledWidth);
    }

    protected updateSize_() {
        const constants = this.getConstants();
        let totalWidth = 0;
        let totalHeight = constants!.FIELD_TEXT_HEIGHT;

        let contentWidth = 0;
        if (this.blockPreview_) {
            const bBox = this.blockPreview_.getBBox();
            contentWidth = bBox.width;
            totalWidth += contentWidth;
            totalHeight = bBox.height;
        }

        this.size_.height = totalHeight;
        this.size_.width = totalWidth;
    }

    static fromJson(options: FieldLocalVariableFromJsonConfig): FieldLocalVariable {
        return new this(options.text ?? "", options.shapeType);
    }
}

Blockly.fieldRegistry.register('field_local_variable', FieldLocalVariable);