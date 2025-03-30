import { GenericBlockDefinition } from "../builder/definitions";
import * as Blockly from "blockly/core"

export abstract class DynamicToolboxCategory {
    abstract getBlocks(workspace: Blockly.Workspace): GenericBlockDefinition[];
}