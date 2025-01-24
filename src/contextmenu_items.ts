import * as Blockly from "blockly/core"
import { Blocks } from "./blocks"
import { showHelp } from "./context/manual/manual_emitter"
import { NodeBlockSvg } from "./blocks/extensions/node"
import { EvaluationAction, triggerAction } from "./evaluation_emitter"

interface ConnectionScope extends Blockly.ContextMenuRegistry.Scope {
    connection?: Blockly.Connection
}

Blockly.ContextMenuRegistry.registry.unregister("blockComment")
Blockly.ContextMenuRegistry.registry.unregister("blockCollapseExpand")
Blockly.ContextMenuRegistry.registry.unregister("blockDelete")
Blockly.ContextMenuRegistry.registry.unregister("blockHelp")
Blockly.ContextMenuRegistry.registry.unregister("blockInline")
Blockly.ContextMenuRegistry.registry.unregister("collapseWorkspace")
Blockly.ContextMenuRegistry.registry.unregister("expandWorkspace")
Blockly.ContextMenuRegistry.registry.unregister("cleanWorkspace")
Blockly.ContextMenuRegistry.registry.unregister("workspaceDelete")
Blockly.ContextMenuRegistry.registry.unregister("blockDisable")

export function deleteConnectionOption(connection: Blockly.Connection): Blockly.ContextMenuRegistry.ContextMenuOption {
    const scope: ConnectionScope = { connection }
    return {
        text: "Delete Connection",
        weight: 0,
        scope: scope,
        callback: (scope: ConnectionScope) => {
            if (scope.connection) {
                const sourceBlock = scope.connection.getSourceBlock()
                const targetBlock = scope.connection.targetBlock()
                if (sourceBlock && targetBlock && Blocks.Types.isNodeBlock(sourceBlock) && Blocks.Types.isNodeBlock(targetBlock)) {
                    sourceBlock.unplugNodeConnection(scope.connection)
                    targetBlock.unplugNodeConnection(scope.connection)
                }
            }
            triggerAction(EvaluationAction.ClickContextMenuItem, { menuItem: "Delete Connection", context: "edge" })
        },
        enabled: true
    }
}

export function registerCleanWorkspace() {
    const cleanOption: Blockly.ContextMenuRegistry.RegistryItem = {
        displayText() {
            return Blockly.Msg['CLEAN_UP'];
        },
        preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
            return scope.workspace?.getTopBlocks(false).length ? 'enabled' : 'hidden';
        },
        callback(scope: Blockly.ContextMenuRegistry.Scope) {
            scope.workspace?.cleanUp();
            triggerAction(EvaluationAction.ClickContextMenuItem, { menuItem: "Clean Workspace", context: "workspace" })
        },
        scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
        id: 'cleanWorkspace',
        weight: 1,
    };
    Blockly.ContextMenuRegistry.registry.register(cleanOption);

}

export function registerShowHelp() {
    const helpOption: Blockly.ContextMenuRegistry.RegistryItem = {
        displayText() {
            return Blockly.Msg['HELP'];
        },
        preconditionFn() {
            return "enabled";
        },
        callback() {
            showHelp("#help-start");
            triggerAction(EvaluationAction.ClickContextMenuItem, { menuItem: "Help", context: "workspace" })
        },
        scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
        id: 'help',
        weight: 5,
    };
    Blockly.ContextMenuRegistry.registry.register(helpOption);


}

export function registerShowBlockHelp() {
    const helpOption: Blockly.ContextMenuRegistry.RegistryItem = {
        displayText() {
            return Blockly.Msg['HELP'];
        },
        preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
            return scope.block?.helpUrl ? 'enabled' : 'hidden';
        },
        callback(scope: Blockly.ContextMenuRegistry.Scope) {
            if (scope.block) {
                if (typeof scope.block.helpUrl === "function") {
                    const helpUrl = scope.block.helpUrl()
                    if (helpUrl) {
                        showHelp(helpUrl);
                    }
                } else if (typeof scope.block.helpUrl === "string") {
                    showHelp(scope.block.helpUrl);
                }
                triggerAction(EvaluationAction.ClickContextMenuItem, { menuItem: "Help", blockType: scope.block.type, context: "block" })
            }
        },
        scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
        id: 'blockHelp',
        weight: 5,
    };
    Blockly.ContextMenuRegistry.registry.register(helpOption);

}

export function registerDisable() {
    const disableOption: Blockly.ContextMenuRegistry.RegistryItem = {
      displayText(scope: Blockly.ContextMenuRegistry.Scope) {
        return scope.block!.hasDisabledReason(Blockly.constants.MANUALLY_DISABLED)
          ? Blockly.Msg['ENABLE_BLOCK']
          : Blockly.Msg['DISABLE_BLOCK'];
      },
      preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
        const block = scope.block;
        if (
          !block!.isInFlyout &&
          block!.workspace.options.disable &&
          block!.isEditable()
        ) {
          // Determine whether this block is currently disabled for any reason
          // other than the manual reason that this context menu item controls.
          const disabledReasons = block!.getDisabledReasons();
          const isDisabledForOtherReason =
            disabledReasons.size >
            (disabledReasons.has(Blockly.constants.MANUALLY_DISABLED) ? 1 : 0);
  
          if (block!.getInheritedDisabled() || isDisabledForOtherReason) {
            return 'disabled';
          }
          return 'enabled';
        }
        return 'hidden';
      },
      callback(scope: Blockly.ContextMenuRegistry.Scope) {
        const block = scope.block;
        const existingGroup = Blockly.Events.getGroup();
        if (!existingGroup) {
            Blockly.Events.setGroup(true);
        }
        block!.setDisabledReason(
          !block!.hasDisabledReason(Blockly.constants.MANUALLY_DISABLED),
          Blockly.constants.MANUALLY_DISABLED,
        );
        if (!block!.hasDisabledReason(Blockly.constants.MANUALLY_DISABLED)) {
            triggerAction(EvaluationAction.ClickContextMenuItem, { menuItem: "Enable", blockType: block?.type, context: "block" })
        } else {
            triggerAction(EvaluationAction.ClickContextMenuItem, { menuItem: "Disable", blockType: block?.type, context: "block" })
        }
        Blockly.Events.setGroup(existingGroup);
      },
      scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
      id: 'blockDisable',
      weight: 5,
    };
    Blockly.ContextMenuRegistry.registry.register(disableOption);
  }

export function registerDelete() {
    const deleteOption: Blockly.ContextMenuRegistry.RegistryItem = {
        displayText(scope: Blockly.ContextMenuRegistry.Scope) {
            const block = scope.block;
            // Count the number of blocks that are nested in this block.
            let descendantCount = countDeleteableBlocks_(block!.getDescendants(false));
            const nextBlock = block!.getNextBlock();
            if (nextBlock) {
                // Blocks in the current stack would survive this block's deletion.
                descendantCount -= countDeleteableBlocks_(nextBlock.getDescendants(false));
            }
            return descendantCount === 1
                ? Blockly.Msg['DELETE_BLOCK']
                : Blockly.Msg['DELETE_X_BLOCKS'].replace('%1', `${descendantCount}`);
        },
        preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
            if (!scope.block!.isInFlyout && scope.block!.isDeletable()) {
                return 'enabled';
            }
            return 'hidden';
        },
        callback(scope: Blockly.ContextMenuRegistry.Scope) {
            if (scope.block) {
                scope.block.checkAndDelete()
            }
            triggerAction(EvaluationAction.ClickContextMenuItem, { menuItem: "Delete", blockType: scope.block?.type, context: "block" })
        },
        scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
        id: 'blockDelete',
        weight: 6,
    };
    Blockly.ContextMenuRegistry.registry.register(deleteOption);
}

/**
 * Adds a block and its children to a list of deletable blocks.
 *
 * @param block to delete.
 * @param deleteList list of blocks that can be deleted.
 *     This will be modified in place with the given block and its descendants.
 */
function addDeletableBlocks_(block: Blockly.BlockSvg, deleteList: Blockly.BlockSvg[]) {
    if (block.isDeletable()) {
        Array.prototype.push.apply(deleteList, block.getDescendants(false));
    } else {
        const children = block.getChildren(false);
        for (let i = 0; i < children.length; i++) {
            addDeletableBlocks_(children[i], deleteList);
        }
    }
}

/**
 * Constructs a list of blocks that can be deleted in the given workspace.
 *
 * @param workspace to delete all blocks from.
 * @returns list of blocks to delete.
 */
function getDeletableBlocks_(workspace: Blockly.WorkspaceSvg): Blockly.BlockSvg[] {
    const deleteList: Blockly.BlockSvg[] = [];
    const topBlocks = workspace.getTopBlocks(true);
    for (let i = 0; i < topBlocks.length; i++) {
        addDeletableBlocks_(topBlocks[i], deleteList);
    }
    return deleteList;
}

/**
* Deletes the given blocks. Used to delete all blocks in the workspace.
*
* @param deleteList List of blocks to delete.
* @param eventGroup Event group ID with which all delete events should be
*     associated.  If not specified, create a new group.
*/
function deleteNext_(deleteList: Blockly.BlockSvg[], eventGroup?: string) {
    const DELAY = 0;
    if (eventGroup) {
        Blockly.Events.setGroup(eventGroup);
    } else {
        Blockly.Events.setGroup(true);
        eventGroup = Blockly.Events.getGroup();
    }

    // we first want to delete all edges
    const nodes = deleteList.filter(block => Blocks.Types.isNodeBlock(block)) as NodeBlockSvg[]
    for (const node of nodes) {
        node.deleteEdges()
    }

    const block = deleteList.shift();
    if (block) {
        if (!block.isDeadOrDying()) {
            block.dispose(false, true);
            setTimeout(deleteNext_, DELAY, deleteList, eventGroup);
        } else {
            deleteNext_(deleteList, eventGroup);
        }
    }
    Blockly.Events.setGroup(false);
}

function countDeleteableBlocks_(deletableBlocks: Blockly.BlockSvg[]): number {
    // TODO: we should keep track of blocks that have been added automatically and not by the user
    const primitiveBlocks: string[] = [Blocks.Names.MATH.NUMBER, Blocks.Names.LOGIC.BOOLEAN, Blocks.Names.ENUM.SELECT, Blocks.Names.HIERARCHY.SELECT, Blocks.Names.TIMELINE.DATE_PICKER]
    return deletableBlocks.filter(block => !primitiveBlocks.includes(block.type)).length
}

export function registerDeleteAll() {
    const deleteOption: Blockly.ContextMenuRegistry.RegistryItem = {
        displayText(scope: Blockly.ContextMenuRegistry.Scope) {
            if (!scope.workspace) {
                return '';
            }
            const deletableBlocksLength = countDeleteableBlocks_(getDeletableBlocks_(scope.workspace));
            if (deletableBlocksLength === 1) {
                return Blockly.Msg['DELETE_BLOCK'];
            }
            return Blockly.Msg['DELETE_X_BLOCKS'].replace('%1', `${deletableBlocksLength}`);
        },
        preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
            if (!scope.workspace) {
                return 'disabled';
            }
            const deletableBlocksLength = getDeletableBlocks_(scope.workspace).length;
            return deletableBlocksLength > 0 ? 'enabled' : 'disabled';
        },
        callback(scope: Blockly.ContextMenuRegistry.Scope) {
            if (!scope.workspace) {
                return;
            }
            scope.workspace.cancelCurrentGesture();
            const deletableBlocks = getDeletableBlocks_(scope.workspace);
            const deletableBlocksLength = countDeleteableBlocks_(deletableBlocks);
            if (deletableBlocksLength < 2) {
                deleteNext_(deletableBlocks);
            } else {
                Blockly.dialog.confirm(
                    Blockly.Msg['DELETE_ALL_BLOCKS'].replace(
                        '%1',
                        String(deletableBlocksLength),
                    ),
                    function (ok) {
                        if (ok) {
                            deleteNext_(deletableBlocks);
                        }
                    },
                );
            }
            triggerAction(EvaluationAction.ClickContextMenuItem, { menuItem: "Delete All", context: "workspace" })
        },
        scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
        id: 'workspaceDelete',
        weight: 6,
    };
    Blockly.ContextMenuRegistry.registry.register(deleteOption);
}

/** Registers all block-scoped context menu items. */
function registerBlockOptions_() {
    registerDelete();
    registerShowBlockHelp();
    registerDisable();
}

/** Registers all workspace-scoped context menu items. */
function registerWorkspaceOptions_() {
    registerCleanWorkspace();
    registerShowHelp();
    registerDeleteAll();
}

/**
 * Registers all default context menu items. This should be called once per
 * instance of ContextMenuRegistry.
 *
 * @internal
 */
export function registerDefaultOptions() {
    registerWorkspaceOptions_();
    registerBlockOptions_();
}

registerDefaultOptions();