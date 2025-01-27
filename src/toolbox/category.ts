/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Toolbox category with styling for continuous toolbox.
 */

import * as Blockly from 'blockly/core';
import type { IToolbox } from 'blockly/core/interfaces/i_toolbox.js';
import type { CategoryInfo } from 'blockly/core/utils/toolbox.js';
import { getColor } from "@/themes/colors";
import { evaluateIsHiddenFunc, hasIsHiddenFunc } from '@/blocks/toolbox/toolbox_definition';
import { store } from '@/store/store';
import { EvaluationAction, triggerAction } from '@/evaluation_emitter';

/** Toolbox category for continuous toolbox. */
export class ContinuousCategory extends Blockly.ToolboxCategory {
    /**
     * Constructor for ContinuousCategory which is used in ContinuousToolbox.
     */
    constructor(categoryDef: CategoryInfo, parentToolbox: IToolbox) {
        super(categoryDef, parentToolbox);

        this.categoryDef_ = categoryDef;
    }

    private categoryDef_: CategoryInfo;

    override onClick(): void {
        triggerAction(EvaluationAction.ClickOnCategory, { category: this.name_ })
    }

    override createLabelDom_(name: string): HTMLDivElement {
        const label = document.createElement('div');
        label.setAttribute('id', this.getId() + '.label');
        label.textContent = name;
        label.classList.add(this.cssConfig_['label']!);
        return label;
    }

    override createIconDom_(): HTMLDivElement {
        const icon = document.createElement('div');
        icon.classList.add('categoryBubble');
        icon.style.backgroundColor = this.colour_;
        return icon;
    }

    getCategoryDef() {
        return this.categoryDef_;
    }

    getColor(): string {
        return this.colour_;
    }

    override addColourBorder_() {
        // No-op
    }

    override setSelected(isSelected: boolean) {
        if (this.rowDiv_ === null || this.htmlDiv_ === null || this.cssConfig_['selected'] === undefined) return;
        if (isSelected) {
            this.rowDiv_.style.backgroundColor = getColor("menu-bg-selected");
            Blockly.utils.dom.addClass(this.rowDiv_, this.cssConfig_['selected']);
        } else {
            this.rowDiv_.style.backgroundColor = '';
            Blockly.utils.dom.removeClass(this.rowDiv_, this.cssConfig_['selected']);
        }
        Blockly.utils.aria.setState(
            this.htmlDiv_,
            Blockly.utils.aria.State.SELECTED,
            isSelected,
        );
    }

    isHidden() {
        if (hasIsHiddenFunc(this.categoryDef_)) {
            return evaluateIsHiddenFunc(this.categoryDef_, this.workspace_, store.getState().sourceTable.columns);
        }

        return false;
    }
}

Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName,
    ContinuousCategory,
    true,
);