import { Blocks } from '@/blocks';
import { BlocklyToolboxAdapter } from '@/blocks/toolbox/adapters/blockly_adapter';
import { GenericBlockDefinition } from '@/blocks/toolbox/builder/definitions';
import { subscribe } from '@/store/subscribe';
import * as Blockly from 'blockly/core';

export class ExternalFlyout extends Blockly.VerticalFlyout {
    protected targetDiv: HTMLElement
    private dev_adapter: BlocklyToolboxAdapter = new BlocklyToolboxAdapter([]);

    constructor(workspaceOptions: Blockly.Options, targetDiv: HTMLElement) {
        super(workspaceOptions);
        this.targetDiv = targetDiv;
    }

    // This means that a block is created no matter the angle of the drag
    protected override dragAngleRange_: number = 360;
    override MARGIN: number = 1;
    override CORNER_RADIUS: number = 0;
    protected override tabWidth_: number = 0;

    static inject(div: HTMLElement, workspaceOptions: Blockly.Options) {
        const flyout = new ExternalFlyout(workspaceOptions, div);
        flyout.createDom("svg");
        flyout.setVisible(true);

        subscribe(state => state.settings.settings.zoom, (zoom) => {
            flyout.workspace_.setScale(zoom);
        }, { immediate: true });

        flyout.autoClose = false;

        return flyout;
    }

    override init(targetWorkspace: Blockly.WorkspaceSvg): void {
        super.init(targetWorkspace);
        this.workspace_.scrollbar = null;
    }

    protected override wheel_(e: WheelEvent): void {
        const scrollDelta = Blockly.utils.browserEvents.getScrollDeltaPixels(e);
        const delta = scrollDelta.x || scrollDelta.y;

        if (delta) {
            const metricsManager = this.workspace_.getMetricsManager();
            const scrollMetrics = metricsManager.getScrollMetrics();
            const viewMetrics = metricsManager.getViewMetrics();

            const pos = viewMetrics.left - scrollMetrics.left + delta;
            this.workspace_.scrollbar?.setX(pos);
            // When the flyout moves from a wheel event, hide WidgetDiv and
            // dropDownDiv.
            Blockly.WidgetDiv.hideIfOwnerIsInWorkspace(this.workspace_);
            Blockly.DropDownDiv.hideWithoutAnimation();
        }

        // We want the scroll to be handled by the flyout, not the workspace
        e.stopPropagation();
    }

    addBlock(block: GenericBlockDefinition) {
        this.show([
            this.dev_adapter.blockAdapter(block)
        ])
    }

    addVariable(variable: Blockly.VariableModel) {
        this.show([
            {
                kind: "block",
                type: Blocks.Names.VARIABLE.GET,
                fields: {
                    VAR: {
                        id: variable.getId(),
                        name: variable.name,
                        type: variable.type
                    }
                }
            }
        ])
    }

    override position(): void {
        if (!this.isVisible() || !this.targetWorkspace!.isVisible()) {
            return;
        }

        const metricsManager = this.workspace_.getMetricsManager();
        const metrics = metricsManager.getContentMetrics();
        this.height_ = metrics.height + 2 * this.MARGIN;
        this.width_ = metrics.width + 2 * this.MARGIN;
        this.targetDiv.style.width = this.width_ + 'px';
        this.targetDiv.style.height = this.height_ + 'px';
        this.positionAt_(this.width_, this.height_, 0, 0);
    }

    override getX(): number {
        return 0;
    }

    override getY(): number {
        return 0;
    }

    override isScrollable(): boolean {
        return false;
    }

    override createBlock(originalBlock: Blockly.BlockSvg): Blockly.BlockSvg {
        let newBlock = null;
        Blockly.Events.disable();
        const variablesBeforeCreation = this.targetWorkspace.getAllVariables();
        this.targetWorkspace.setResizesEnabled(false);
        try {
            newBlock = this.placeNewBlockOverride(originalBlock);
        } finally {
            Blockly.Events.enable();
        }

        const newVariables = Blockly.Variables.getAddedVariables(
            this.targetWorkspace,
            variablesBeforeCreation,
        );

        if (Blockly.Events.isEnabled()) {
            Blockly.Events.setGroup(true);
            // Fire a VarCreate event for each (if any) new variable created.
            for (let i = 0; i < newVariables.length; i++) {
                const thisVariable = newVariables[i];
                Blockly.Events.fire(
                    new (Blockly.Events.get(Blockly.Events.VAR_CREATE))(thisVariable),
                );
            }

            // Block events come after var events, in case they refer to newly created
            // variables.
            Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.BLOCK_CREATE))(newBlock));
        }

        // this.filterForCapacity();

        return newBlock;
    }

    private placeNewBlockOverride(oldBlock: Blockly.BlockSvg): Blockly.BlockSvg {
        const targetWorkspace = this.targetWorkspace;
        const svgRootOld = oldBlock.getSvgRoot();
        if (!svgRootOld) {
            throw Error('oldBlock is not rendered');
        }

        // Clone the block.
        const json = this.serializeBlock(oldBlock);
        // Normally this resizes leading to weird jumps. Save it for terminateDrag.
        targetWorkspace.setResizesEnabled(false);
        const block = Blockly.serialization.blocks.append(json, targetWorkspace) as Blockly.BlockSvg;

        this.positionNewBlockOverride(oldBlock, block);

        return block;
    }

    private positionNewBlockOverride(oldBlock: Blockly.BlockSvg, block: Blockly.BlockSvg) {
        const targetWorkspace = this.targetWorkspace;

        const bounds = this.targetDiv.getBoundingClientRect();
        const oldBlockPos = oldBlock.getRelativeToSurfaceXY();
        oldBlockPos.scale(this.workspace_.scale);
        const finalOffset = {
            x: bounds.left + oldBlockPos.x,
            y: bounds.top + oldBlockPos.y
        };

        const relativeCoords = new Blockly.utils.Coordinate(finalOffset.x, finalOffset.y);
        const absoluteCoords = targetWorkspace.getOriginOffsetInPixels();
        const finalOffsetInWorkspace = relativeCoords.translate(-absoluteCoords.x, -absoluteCoords.y);
        finalOffsetInWorkspace.scale(1 / targetWorkspace.scale);

        block.moveTo(finalOffsetInWorkspace);
    }

    override createDom(tagName: string | Blockly.utils.Svg<SVGSVGElement> | Blockly.utils.Svg<SVGGElement>): SVGElement {
        const element = super.createDom(tagName);
        this.targetDiv.appendChild(element);

        Blockly.utils.browserEvents.conditionalBind(
            element,
            "contextmenu",
            null,
            (e: MouseEvent) => {
                if (!Blockly.utils.browserEvents.isTargetInput(e)) {
                    e.preventDefault();
                }
            },
        );

        return element;
    }
}