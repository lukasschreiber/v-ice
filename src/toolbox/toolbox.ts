/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * modified by Lukas Schreiber to support Typescript
 */

import * as Blockly from 'blockly/core';
import * as toolbox from 'blockly/core/utils/toolbox';
import type {ISelectableToolboxItem} from 'blockly/core/interfaces/i_selectable_toolbox_item.js';
import {ContinuousFlyout} from "@/toolbox/flyout";
import style from "./toolbox.css?inline";
import { subscribe } from '@/store/subscribe';
import { Blocks } from '@/blocks';
import { evaluateIsHiddenFunc, hasIsHiddenFunc, registerCategory } from '@/blocks/toolbox/toolbox_definition';
import { store } from '@/store/store';
import { ContinuousCategory } from './category';
export * from './category'

export class ContinuousToolbox extends Blockly.Toolbox {
    constructor(workspace: Blockly.WorkspaceSvg) {
        super(workspace);
    }

    override init() {
        super.init();

        const flyout = this.getFlyout();
        if (flyout) {
            this.contents_.forEach((item) => {
                if(item instanceof ContinuousCategory) {
                    registerCategory(item.getCategoryDef(), this.workspace_);
                }
            });

            flyout.show(this.getInitialFlyoutContents_());
            flyout.recordScrollPositions();
        }

        this.workspace_.addChangeListener((e) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (e.type === Blockly.Events.CREATE && (e.toJson() as any).json.type !== Blocks.Names.VARIABLE.LOCAL_GET) {
                this.refreshSelection();
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (e.type === Blockly.Events.DELETE && (e.toJson() as any).oldJson.type !== Blocks.Names.VARIABLE.LOCAL_GET) {
                this.refreshSelection();
            }
        });

        subscribe(state => state.blockly.targetBlocks, () => {
            this.refreshSelection();
        })
    }

    getFlyout(): ContinuousFlyout {
        return super.getFlyout() as ContinuousFlyout
    }

    /**
     * Gets the contents that should be shown in the flyout immediately.
     * This includes all blocks and labels for each category of block.
     * @returns Flyout contents.
     */
    private getInitialFlyoutContents_(): toolbox.FlyoutItemInfoArray {
        let contents: toolbox.FlyoutItemInfoArray = [];
        for (const toolboxItem of this.contents_.filter(item => (item instanceof ContinuousCategory) && !item.isHidden())) {
            if (toolboxItem instanceof Blockly.ToolboxCategory) {
                // Create a label node to go at the top of the category
                contents.push({kind: 'LABEL', text: toolboxItem.getName()});
                const itemContents: string | toolbox.FlyoutItemInfoArray | toolbox.FlyoutItemInfo = toolboxItem.getContents();

                // Handle custom categories (e.g. variables and functions)
                if (typeof itemContents === 'string') {
                    contents = contents.concat({
                        custom: itemContents,
                        kind: 'CATEGORY',
                    })
                } else {
                    contents = contents.concat(itemContents.filter((item) => {
                        if(hasIsHiddenFunc(item)) {
                            return !evaluateIsHiddenFunc(item, this.workspace_, store.getState().sourceTable.columns);
                        }
                    }));
                }
            }
        }
        return contents;
    }

    protected override renderContents_(toolboxDef: Blockly.utils.toolbox.ToolboxItemInfo[]) {
        super.renderContents_(toolboxDef.filter((item) => {
            if(hasIsHiddenFunc(item)) {
                return !evaluateIsHiddenFunc(item, this.workspace_, store.getState().sourceTable.columns);
            }

            return true;
        }));
    }

    override refreshSelection() {
        this.getFlyout()?.show(this.getInitialFlyoutContents_());
    }

    override updateFlyout_(_oldItem: ISelectableToolboxItem | null, newItem: ISelectableToolboxItem | null) {
        if (newItem) {
            const target = this.getFlyout().getCategoryScrollPosition(
                newItem.getName(),
            )?.y || 0;
            this.getFlyout().scrollTo(target);
        }
    }

    override shouldDeselectItem_(oldItem: ISelectableToolboxItem | null, newItem: ISelectableToolboxItem | null): boolean {
        // Should not deselect if the same category is clicked again.
        return oldItem! && oldItem! !== newItem!;
    }

    /**
     * Gets a category by name.
     * @param name Name of category to get.
     * @returns Category, or null if not
     *    found.
     */
    getCategoryByName(name: string): Blockly.ToolboxCategory | null {
        const category = this.contents_.find(
            (item) =>
                item instanceof Blockly.ToolboxCategory &&
                item.isSelectable() &&
                name === item.getName(),
        );
        if (category) {
            return category as Blockly.ToolboxCategory
        }
        return null;
    }

    getCategoryByBlockType(type: string): Blockly.ToolboxCategory | null {
        const category = this.contents_.find(
            (item) => {
                if (!(item instanceof Blockly.ToolboxCategory)) return false
                if (!item.isSelectable()) return false
                const contents = item.getContents()
                if (!Array.isArray(contents)) {
                    // custom category
                    if (item instanceof ContinuousCategory) {
                        const dynamicCategory = item.getCategoryDef() as Blockly.utils.toolbox.DynamicCategoryInfo
                        if (dynamicCategory.custom === "NODES" && (Object.values(Blocks.Names.NODE) as string[]).includes(type)) {
                            return true
                        }
                    }
                    return false
                }
                return contents.some((block) => {
                    return block.kind === "block" && (block as Blockly.utils.toolbox.BlockInfo).type === type
                })
            }
        );

        if (category) {
            return category as Blockly.ToolboxCategory;
        }

        return null
    }

    /**
     * Selects the category with the given name.
     * Similar to setSelectedItem, but importantly, does not call updateFlyout
     * because this is called while the flyout is being scrolled.
     * @param name Name of category to select.
     */
    selectCategoryByName(name: string) {
        const newItem = this.getCategoryByName(name);
        if (!newItem) {
            return;
        }

        const oldItem = this.selectedItem_;

        if (this.shouldDeselectItem_(oldItem, newItem)) {
            this.deselectItem_(oldItem!);
        }

        if (this.shouldSelectItem_(oldItem, newItem)) {
            this.selectItem_(oldItem, newItem);
        }
    }

    override getClientRect() {
        // If the flyout never closes, it should be the deletable area.
        const flyout = this.getFlyout();
        if (flyout && !flyout.autoClose) {
            return flyout.getClientRect();
        }
        return super.getClientRect();
    }
}

Blockly.Css.register(style);