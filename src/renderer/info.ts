import * as Blockly from "blockly/core"
import { Renderer } from "@/renderer/renderer"
import { FieldEdgeConnection } from "@/blocks/fields/field_edge_connection"
import { Blocks } from "@/blocks"
import { InlineInput } from "./measurables/inline_input"
import { ConstantProvider } from "./constants"
import { FieldSetSelection } from "@/blocks/fields/field_set_selection"

export class RenderInfo extends Blockly.zelos.RenderInfo {
    constructor(renderer: Renderer, block: Blockly.BlockSvg) {
        super(renderer, block)
        if (Blocks.Types.isNodeBlock(block)) {
            this.width = 240 // 220 works for english
            this.constants_.DUMMY_INPUT_MIN_HEIGHT = 18
        } else {
            // resetting this is really important
            // TODO: it should not need to be reset
            this.constants_.DUMMY_INPUT_MIN_HEIGHT = 24
        }
    }

    override getSpacerRowHeight_(prev: Blockly.blockRendering.Row, next: Blockly.blockRendering.Row): number {
        if (this.rowContainsFieldEdgeConnection(prev) && next.hasStatement) {
            return this.constants_.MEDIUM_PADDING
        }

        if (this.rowContainsFieldEdgeConnection(prev) || this.rowContainsFieldEdgeConnection(next)) {
            return this.constants_.SMALL_PADDING
        }

        return super.getSpacerRowHeight_(prev, next) // basically just MEDIUM_PADDING
    }

    private rowContainsFieldEdgeConnection(row: Blockly.blockRendering.Row): boolean {
        return row.elements.some(element => element instanceof Blockly.blockRendering.Field && element.field instanceof FieldEdgeConnection)
    }

    override addInput_(input: Blockly.Input, activeRow: Blockly.blockRendering.Row) {
        // Non-dummy inputs have visual representations onscreen.
        if (this.isInline && input instanceof Blockly.inputs.ValueInput) {
            // NOTE: this is the only change from the original method, we use our own InlineInput
            activeRow.elements.push(new InlineInput(this.constants_ as ConstantProvider, input));
            activeRow.hasInlineInput = true;
        } else if (input instanceof Blockly.inputs.StatementInput) {
            activeRow.elements.push(
                new Blockly.blockRendering.StatementInput(this.constants_, input),
            );
            activeRow.hasStatement = true;
        } else if (input instanceof Blockly.inputs.ValueInput) {
            activeRow.elements.push(new Blockly.blockRendering.ExternalValueInput(this.constants_, input));
            activeRow.hasExternalInput = true;
        } else if (input instanceof Blockly.inputs.DummyInput || input instanceof Blockly.inputs.EndRowInput) {
            // Dummy and end-row inputs have no visual representation, but the
            // information is still important.
            activeRow.minHeight = Math.max(
                activeRow.minHeight,
                input.getSourceBlock() && input.getSourceBlock()!.isShadow()
                    ? this.constants_.DUMMY_INPUT_SHADOW_MIN_HEIGHT
                    : this.constants_.DUMMY_INPUT_MIN_HEIGHT,
            );
            activeRow.hasDummyInput = true;
        }
        if (activeRow.align === null) {
            activeRow.align = input.align;
        }
    }

    protected override createRows_(): void {
        super.createRows_()
        
        // this is a hack to make the FieldSetSelection field look better
        // we assume that the FieldSetSelection field is only used in the first content row
        // maybe one could do magic with the centerline property but I did not figure out how
        const fieldSetSelection = this.rows[1].elements.find(element => element instanceof Blockly.blockRendering.Field && element.field instanceof FieldSetSelection)
        if(fieldSetSelection) {
            const newHeight = fieldSetSelection.height / 3 // we want the field to span 3 rows
            fieldSetSelection.height = newHeight + 3 // 3 seems to be the magic number to make it look good
            
            const index = this.rows[1].elements.indexOf(fieldSetSelection)
            // we want to center the field in the block, we do this by adding a spacer with a guessed width, I am so sorry :(
            this.rows[1].elements.splice(index, 0, new Blockly.blockRendering.InRowSpacer(this.constants_, 5))

            this.rows.forEach(row => {
                const fieldEdgeConnection = row.elements.find(element => element instanceof Blockly.blockRendering.Field && element.field instanceof FieldEdgeConnection)
                if(fieldEdgeConnection) {
                    fieldEdgeConnection.height = newHeight - 5 // 5 seems to be the magic number to make it look good
                }
            })
        }
    }
}