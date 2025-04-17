import * as Blockly from 'blockly/core';
import { FlyoutItem } from 'blockly/core/flyout_base'
import { ContinuousToolbox } from "@/toolbox/blockly/toolbox";
import { ContinuousFlyoutMetrics } from "@/toolbox/blockly/metrics_flyout";
import { FieldLabelTargetNode } from '@/blocks/fields/field_label_target_node';
import { Blocks } from '@/blocks';
import { EvaluationAction, triggerAction } from '@/evaluation_emitter';
import { store } from '@/store/store';

export interface Position { x: number, y: number }

export class ContinuousFlyout extends Blockly.VerticalFlyout {

    private lastDefinition_: Blockly.utils.toolbox.FlyoutDefinition | null = null;

    /**
     * List of scroll positions for each category.
     */
    scrollPositions: { name: string; position: Position; }[] = [];

    /**
     * Target scroll position, used to smoothly scroll to a given category
     * location when selected.
     */
    scrollTarget: number | null = null;

    /**
     * The percentage of the distance to the scrollTarget that should be
     * scrolled at a time. Lower values will produce a smoother, slower scroll.
     */
    scrollAnimationFraction: number = 0.3;

    /**
     * Whether to recycle blocks when refreshing the flyout. When false, do not
     * allow anything to be recycled. The default is to recycle.
     */
    private recyclingEnabled_: boolean = true;

    private boundEvents_: Blockly.utils.browserEvents.Data[] = [];

    private listeners_: Blockly.utils.browserEvents.Data[] = [];

    private filterWrapper_: ((e: Blockly.Events.Abstract) => void) | null = null;

    labelGaps: number[] = []

    constructor(workspaceOptions: Blockly.Options) {
        super(workspaceOptions);

        this.workspace_.setMetricsManager(
            new ContinuousFlyoutMetrics(this.workspace_, this),
        );

        this.workspace_.addChangeListener((e) => {
            // if (e.type === Blockly.Events.VIEWPORT_CHANGE) {
            //     this.selectCategoryByScrollPosition_(-this.workspace_.scrollY);
            // }
        });

        this.autoClose = false;

    }

    override init(targetWorkspace: Blockly.WorkspaceSvg): void {
        this.targetWorkspace = targetWorkspace;
        this.workspace_.targetWorkspace = targetWorkspace;

        this.workspace_.scrollbar = new Blockly.ScrollbarPair(
            this.workspace_,
            this.horizontalLayout,
            !this.horizontalLayout,
            'blocklyFlyoutScrollbar',
            this.SCROLLBAR_MARGIN,
        );

        this.hide();

        this.boundEvents_.push(
            Blockly.utils.browserEvents.conditionalBind(
                this.svgGroup_ as SVGGElement,
                'wheel',
                this,
                this.wheel_,
            ),
        );
        // this.filterWrapper_ = this.filterForCapacity_.bind(this);
        // this.targetWorkspace.addChangeListener(this.filterWrapper_);

        // Dragging the flyout up and down.
        this.boundEvents_.push(
            Blockly.utils.browserEvents.conditionalBind(
                this.svgBackground_ as SVGPathElement,
                'pointerdown',
                this,
                this.onMouseDown_,
            ),
        );

        // A flyout connected to a workspace doesn't have its own current gesture.
        this.workspace_.getGesture = this.targetWorkspace.getGesture.bind(
            this.targetWorkspace,
        );

        // Get variables from the main workspace rather than the target workspace.
        this.workspace_.setVariableMap(this.targetWorkspace.getVariableMap());

        this.workspace_.createPotentialVariableMap();

        targetWorkspace.getComponentManager().addComponent({
            component: this,
            weight: 1,
            capabilities: [
                Blockly.ComponentManager.Capability.AUTOHIDEABLE,
                Blockly.ComponentManager.Capability.DELETE_AREA,
                Blockly.ComponentManager.Capability.DRAG_TARGET,
            ],
        });
    }

    override dispose(): void {
        this.hide();
        this.targetWorkspace.getComponentManager().removeComponent(this.id);
        for (const event of this.boundEvents_) {
            Blockly.utils.browserEvents.unbind(event);
        }
        this.boundEvents_.length = 0;
        if (this.filterWrapper_) {
            this.targetWorkspace.removeChangeListener(this.filterWrapper_);
        }
        if (this.workspace_) {
            this.workspace_.getThemeManager().unsubscribe(this.svgBackground_!);
            this.workspace_.dispose();
        }
        if (this.svgGroup_) {
            Blockly.utils.dom.removeNode(this.svgGroup_);
        }
    }

    override hide(): void {
        super.hide()
        for (const listen of this.listeners_) {
            Blockly.utils.browserEvents.unbind(listen);
        }
        this.listeners_.length = 0;
    }

    protected override addBlockListeners_(root: SVGElement, block: Blockly.BlockSvg, rect: SVGElement): void {
        this.listeners_.push(
            Blockly.utils.browserEvents.conditionalBind(
                root,
                'pointerdown',
                null,
                this.blockMouseDown_(block),
            ),
        );
        this.listeners_.push(
            Blockly.utils.browserEvents.conditionalBind(
                rect,
                'pointerdown',
                null,
                this.blockMouseDown_(block),
            ),
        );
        this.listeners_.push(
            Blockly.utils.browserEvents.bind(root, 'pointerenter', block, () => {
                if (!this.targetWorkspace.isDragging()) {
                    block.addSelect();
                }
            }),
        );
        this.listeners_.push(
            Blockly.utils.browserEvents.bind(root, 'pointerleave', block, () => {
                if (!this.targetWorkspace.isDragging()) {
                    block.removeSelect();
                }
            }),
        );
        this.listeners_.push(
            Blockly.utils.browserEvents.bind(rect, 'pointerenter', block, () => {
                if (!this.targetWorkspace.isDragging()) {
                    block.addSelect();
                }
            }),
        );
        this.listeners_.push(
            Blockly.utils.browserEvents.bind(rect, 'pointerleave', block, () => {
                if (!this.targetWorkspace.isDragging()) {
                    block.removeSelect();
                }
            }),
        );
    }

    /**
     * Gets parent toolbox.
     * Since we registered the ContinuousToolbox, we know that's its type.
     * @returns Toolbox that owns this flyout.
     */
    private getParentToolbox_(): ContinuousToolbox {
        return this.targetWorkspace.getToolbox() as ContinuousToolbox;
    }

    /**
   * Pointer down on the flyout background.  Start a vertical scroll drag.
   *
   * @param e Pointer down event.
   */
    private onMouseDown_(e: PointerEvent) {
        const gesture = this.targetWorkspace.getGesture(e);
        if (gesture) {
            gesture.handleFlyoutStart(e, this);
        }
    }

    /**
 * Handle a pointerdown on an SVG block in a non-closing flyout.
 *
 * @param block The flyout block to copy.
 * @returns Function to call when block is clicked.
 */
    private blockMouseDown_(block: Blockly.BlockSvg): (e: PointerEvent) => void {
        return (e: PointerEvent) => {
            const gesture = this.targetWorkspace.getGesture(e);
            if (gesture) {
                gesture.setStartBlock(block);
                gesture.handleFlyoutStart(e, this);
            }
        };
    }


    /**
     * Records scroll position for each category in the toolbox.
     * The scroll position is determined by the coordinates of each category's
     * label after the entire flyout has been rendered.
     */
    recordScrollPositions() {
        this.scrollPositions = [];
        const categoryLabels = this.buttons_.filter(
            (button) =>
                button.isLabel() &&
                this.getParentToolbox_()?.getCategoryByName(button.getButtonText()),
        );
        for (const [index, button] of categoryLabels.entries()) {
            if (button.isLabel()) {
                const position = button.getPosition();
                const adjustedPosition = new Blockly.utils.Coordinate(
                    position.x,
                    position.y - this.labelGaps[index],
                );
                this.scrollPositions.push({
                    name: button.getButtonText(),
                    position: adjustedPosition,
                });
            }
        }
    }

    /**
     * Returns the scroll position for the given category name.
     * @param name Category name.
     * @returns Scroll position for given category, or null if not
     *     found.
     */
    public getCategoryScrollPosition(name: string): Position | null {
        for (const scrollInfo of this.scrollPositions) {
            if (scrollInfo.name === name) {
                return scrollInfo.position;
            }
        }
        console.warn(`Scroll position not recorded for category ${name}`);
        return null;
    }

    /**
     * Selects an item in the toolbox based on the scroll position of the flyout.
     * @param position Current scroll position of the workspace.
     */
    private selectCategoryByScrollPosition_(position: number) {
        // If we are currently auto-scrolling, due to selecting a category by
        // clicking on it, do not update the category selection.
        if (this.scrollTarget !== null) {
            return;
        }
        const scaledPosition = Math.round(position / this.workspace_.scale);
        // Traverse the array of scroll positions in reverse, so we can select the
        // furthest category that the scroll position is beyond.
        for (let i = this.scrollPositions.length - 1; i >= 0; i--) {
            const category = this.scrollPositions[i];
            if (scaledPosition >= category.position.y) {
                (this.getParentToolbox_() as ContinuousToolbox).selectCategoryByName(category.name);
                return;
            }
        }
    }

    /**
     * Scrolls flyout to given position.
     * @param position The Y coordinate to scroll to.
     */
    scrollTo(position: number) {
        // Set the scroll target to either the scaled position or the lowest
        // possible scroll point, whichever is smaller.
        const metrics = this.workspace_.getMetrics();
        this.scrollTarget = Math.min(
            position * this.workspace_.scale,
            metrics.scrollHeight - metrics.viewHeight,
        );

        this.stepScrollAnimation_();
    }

    updateToolboxPosition(position: Blockly.utils.toolbox.Position) {
        this.toolboxPosition_ = position;
        this.position();
    }

    /**
     * Step the scrolling animation by scrolling a fraction of the way to
     * a scroll target, and request the next frame if necessary.
     */
    private stepScrollAnimation_() {
        if (this.scrollTarget === null) {
            return;
        }

        const currentScrollPos = -this.workspace_.scrollY;
        const diff = this.scrollTarget - currentScrollPos;
        if (Math.abs(diff) < 1) {
            this.workspace_.scrollbar?.setY(this.scrollTarget);
            this.scrollTarget = null;
            return;
        }
        this.workspace_.scrollbar?.setY(
            currentScrollPos + diff * this.scrollAnimationFraction,
        );

        requestAnimationFrame(this.stepScrollAnimation_.bind(this));
    }

    /**
     * Add additional padding to the bottom of the flyout if needed,
     * in order to make it possible to scroll to the top of the last category.
     * @param contentMetrics Content
     *    metrics for the flyout.
     * @param viewMetrics View metrics
     *    for the flyout.
     * @returns Additional bottom padding.
     */
    calculateBottomPadding(contentMetrics: Blockly.MetricsManager.ContainerRegion, viewMetrics: Blockly.MetricsManager.ContainerRegion): number {
        if (this.scrollPositions.length > 0) {
            const lastCategory =
                this.scrollPositions[this.scrollPositions.length - 1];
            const lastPosition = lastCategory.position.y * this.workspace_.scale;
            const lastCategoryHeight = contentMetrics.height - lastPosition;
            if (lastCategoryHeight < viewMetrics.height) {
                return viewMetrics.height - lastCategoryHeight;
            }
        }
        return 0;
    }

    override isVisible(): boolean {
        const settings = store.getState().settings.settings;
        return settings.toolboxVisible && settings.toolboxVersion === "standard" && super.isVisible();
    }

    override getX(): number {
        if (
            this.isVisible() &&
            this.targetWorkspace.toolboxPosition === this.toolboxPosition_ &&
            this.targetWorkspace.getToolbox() &&
            this.toolboxPosition_ !== Blockly.utils.toolbox.Position.LEFT
        ) {
            // This makes it so blocks cannot go under the flyout in RTL mode.
            return this.targetWorkspace.getMetricsManager().getViewMetrics().width;
        }

        return super.getX();
    }

    override show(flyoutDef: Blockly.utils.toolbox.FlyoutDefinition) {
        super.show(flyoutDef);
        this.lastDefinition_ = flyoutDef;
        this.filterForCapacity_()
        this.recordScrollPositions();
        this.workspace_.resizeContents();
        this.selectCategoryByScrollPosition_(0);
    }

    private isTargetNodeCapacityAvailable(block: Blockly.Block) {
        if (block.type === Blocks.Names.NODE.TARGET) {
            return (this.targetWorkspace.getBlocksByType(Blocks.Names.NODE.TARGET).find(b => (b.getField("LABEL") as FieldLabelTargetNode).getId() === (block!.getField("LABEL") as FieldLabelTargetNode).getId()) === undefined)
        }
        return true
    }

    private filterForCapacity_() {
        const blocks = this.workspace_.getTopBlocks(false);
        for (let i = 0, block; (block = blocks[i]); i++) {
            // FIXME: we ignore permanently disabled blocks (blocks that have been disabled before) 
            // https://github.com/google/blockly/blob/e2df0fc2885cb994886c0af863035f50bb849948/core/flyout_base.ts#L1237
            const enable = this.targetWorkspace.isCapacityAvailable(
                Blockly.common.getBlockTypeCounts(block),
            ) && this.isTargetNodeCapacityAvailable(block);
            while (block) {
                block.setDisabledReason(!enable, "Capacity exceeded")
                block = block.getNextBlock();
            }
        }
    }

    getDefintion() {
        return this.lastDefinition_;
    }

    /**
     * Determine if this block can be recycled in the flyout.  Blocks that have no
     * variables and are not dynamic shadows can be recycled.
     * @param block The block to attempt to recycle.
     * @returns True if the block can be recycled.
     */
    protected blockIsRecyclable_(block: Blockly.BlockSvg): boolean {
        if (!this.recyclingEnabled_) {
            return false;
        }

        // If the block needs to parse mutations, never recycle.
        if (block.mutationToDom && block.domToMutation) {
            return false;
        }

        // never recycle blocks with a FieldLabelTargetNode
        if (block.inputList.some(i => i.fieldRow.some(f => f instanceof FieldLabelTargetNode))) {
            return false;
        }

        if (!block.isEnabled()) {
            return false;
        }

        for (const input of block.inputList) {
            for (const field of input.fieldRow) {
                // No variables.
                if (field.referencesVariables()) {
                    return false;
                }
                if (field instanceof Blockly.FieldDropdown) {
                    if (field.isOptionListDynamic()) {
                        return false;
                    }
                }
            }
            // Check children.
            if (input.connection) {
                const targetBlock = input.connection.targetBlock() as Blockly.BlockSvg;
                if (targetBlock && !this.blockIsRecyclable_(targetBlock)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Sets the function used to determine whether a block is recyclable.
     * @param func The function used to
     *     determine if a block is recyclable.
     */
    public setBlockIsRecyclable(func: (block: Blockly.BlockSvg) => boolean) {
        this.blockIsRecyclable_ = func;
    }

    /**
     * Set whether the flyout can recycle blocks.
     * @param isEnabled True to allow blocks to be recycled, false
     *     otherwise.
     */
    public setRecyclingEnabled(isEnabled: boolean) {
        this.recyclingEnabled_ = isEnabled;
    }

    protected override initFlyoutButton_(button: Blockly.FlyoutButton, x: number, y: number): void {
        const buttonSvg = button.createDom();
        button.moveTo(x, y);
        button.show();
        // Clicking on a flyout button or label is a lot like clicking on the
        // flyout background.
        this.listeners_.push(
            Blockly.utils.browserEvents.conditionalBind(
                buttonSvg,
                'pointerdown',
                this,
                this.onMouseDown_,
            ),
        );

        this.buttons_.push(button);
    }

    override createBlock(originalBlock: Blockly.BlockSvg): Blockly.BlockSvg {
        const newBlock = super.createBlock(originalBlock)
        if (!this.autoClose) {
            this.filterForCapacity_()
        }
        triggerAction(EvaluationAction.CreateBlockInToolbox, { blockType: newBlock.type })
        return newBlock
    }

    /**
     * Lay out the blocks in the flyout.
     * @param contents The blocks and buttons to lay out.
     * @param gaps The visible gaps between blocks.
     */
    layout_(contents: FlyoutItem[], gaps: number[]) {
        super.layout_(contents, gaps);
        this.labelGaps = [];
        for (const [index, item] of contents.entries()) {
            if (item.type === 'button' && item.button?.isLabel()) {
                this.labelGaps.push(gaps[index - 1] ? Math.ceil(gaps[index - 1] / 2) : this.MARGIN);
            }
        }
    }
}