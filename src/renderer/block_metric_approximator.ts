import { GenericBlockDefinition } from '@/blocks/toolbox/builder/definitions';
import { blockStateToBlock } from '@/blocks/toolbox/utils';
import * as Blockly from 'blockly/core';
import { Renderer } from './renderer';
import { debug } from '@/utils/logger';
import { hash } from '@/utils/hash';
import { subscribe } from '@/store/subscribe';
import { setBlocklyLocale } from '@/i18n';
import { ConstantProvider } from './constants';
import { createUsedDummyVariables } from '@/utils/create_used_dummy_variables';

const hiddenDiv = document.createElement('div');
hiddenDiv.style.position = 'absolute';
hiddenDiv.style.visibility = 'hidden';
hiddenDiv.id = "metrics-hidden-div";
document.body.appendChild(hiddenDiv);

const hiddenWorkspace = Blockly.inject(hiddenDiv, {
    renderer: Renderer.name,
    readOnly: true,
});

// hash -> { width, height }
const metricsCache: Map<number, { width: number; height: number }> = new Map();

const metricsManager = hiddenWorkspace.getMetricsManager();

subscribe(state => state.settings.language, language => {
    setBlocklyLocale(language);
    metricsCache.clear();
    debug('Blockly locale changed, cleared metrics cache').log();
}, { immediate: true });

export function getBlockHeightWidth(block: GenericBlockDefinition, scale: number): { width: number; height: number } {
    const blockHash = hash(block);
    if (!metricsCache.has(blockHash)) {
        const metrics = computeBlockHeightWidth(block);
        metricsCache.set(blockHash, metrics);
    }

    const metrics = metricsCache.get(blockHash)!;

    return {
        width: metrics.width * scale,
        height: metrics.height * scale,
    }
}

debug('Hidden workspace created').log();

function computeBlockHeightWidth(block: GenericBlockDefinition): { width: number; height: number } {
    hiddenWorkspace.clear();
    hiddenWorkspace.getAllVariables().forEach(variable => hiddenWorkspace.deleteVariableById(variable.getId()));
    const blockInstance = blockStateToBlock(createUsedDummyVariables(block, hiddenWorkspace), hiddenWorkspace) as Blockly.BlockSvg;
    blockInstance.initSvg();
    blockInstance.render();

    let additionalHeight = 0;

    // TODO: this is not the best way, but somehow style.hat is always an empty string....
    if (blockInstance.getStyleName() === "capped_node_blocks") {
        additionalHeight += new ConstantProvider().START_HAT_HEIGHT;
    }

    const blockMetrics = metricsManager.getContentMetrics();
    blockInstance.dispose();
    return {
        width: blockMetrics.width,
        height: blockMetrics.height + additionalHeight,
    };
}