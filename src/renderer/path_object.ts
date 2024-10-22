import * as Blockly from "blockly/core"

export class PathObject extends Blockly.zelos.PathObject {
    updateSelected(): void {
        // We do not want to highlight selected blocks
    }

    override addConnectionHighlight(connection: Blockly.RenderedConnection, connectionPath: string, offset: Blockly.utils.Coordinate, rtl: boolean): void {
        // We only want to highlight input connections that are not connected to another block, those are highlighted by the constants.REPLACEMENT_GLOW_COLOUR setting
        if(connection.type !== Blockly.INPUT_VALUE) return
        if(connection.isConnected()) return
        super.addConnectionHighlight(connection, connectionPath, offset, rtl)
    }
}