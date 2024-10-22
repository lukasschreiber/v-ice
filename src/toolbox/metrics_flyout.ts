/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ContinuousFlyout} from "@/toolbox/flyout";

/** Adds additional padding to the bottom of the flyout if needed. */
export class ContinuousFlyoutMetrics extends Blockly.FlyoutMetricsManager {
  constructor(workspace: Blockly.WorkspaceSvg, flyout: ContinuousFlyout) {
    super(workspace, flyout);
  }
  /**
   * Adds additional padding to the bottom of the flyout if needed,
   * in order to make it possible to scroll to the top of the last category.
   */
  override getScrollMetrics(
    getWorkspaceCoordinates = undefined,
    cachedViewMetrics = undefined,
    cachedContentMetrics = undefined,
  ) {
    const scrollMetrics = super.getScrollMetrics(
      getWorkspaceCoordinates,
      cachedViewMetrics,
      cachedContentMetrics,
    );
    const contentMetrics =
      cachedContentMetrics || this.getContentMetrics(getWorkspaceCoordinates);
    const viewMetrics =
      cachedViewMetrics || this.getViewMetrics(getWorkspaceCoordinates);

    if (scrollMetrics) {
      scrollMetrics.height += (this.flyout_ as ContinuousFlyout).calculateBottomPadding(
        contentMetrics,
        viewMetrics,
      );
    }
    return scrollMetrics;
  }
}