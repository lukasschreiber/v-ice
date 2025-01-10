import * as Blockly from 'blockly/core';
import { BlockExtension } from '../block_extensions';

export interface ScopedBlockExtension {
    isScoped_: boolean
    scope: string
    setScope: (scope: string) => void
}

export type ScopedBlock = Blockly.BlockSvg & ScopedBlockExtension

export class ScopedExtension extends BlockExtension<Blockly.Block> implements ScopedBlockExtension {
    constructor() {
        super("scoped")
    }

    @BlockExtension.mixin
    isScoped_: boolean = true

    @BlockExtension.mixin
    scope: string = ""

    @BlockExtension.mixin
    setScope(scope: string) {
        this.scope = scope
    }

    extension(this: Blockly.Block) {}
}