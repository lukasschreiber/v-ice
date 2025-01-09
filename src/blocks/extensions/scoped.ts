import * as Blockly from 'blockly/core';
import { BlockExtension, mixin } from '../block_extensions';

export interface ScopedBlockExtension{
    isScoped_: boolean
    scope: string
    setScope: (scope: string) => void
}

export type ScopedBlock = Blockly.BlockSvg & ScopedBlockExtension

export class ScopedExtension extends BlockExtension<Blockly.Block> implements ScopedBlockExtension {
    constructor() {
        super("scoped")
    }

    @mixin
    isScoped_: boolean = true

    @mixin
    scope: string = ""

    @mixin
    setScope(scope: string) {
        this.scope = scope
    }

    extension(this: Blockly.Block) {}
}