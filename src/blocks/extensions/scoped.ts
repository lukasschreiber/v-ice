import * as Blockly from 'blockly/core';

export type ScopedExtension = Partial<Blockly.BlockSvg> & {
    isScoped_: boolean
    scope: string
    setScope: (scope: string) => void
}

export type ScopedBlock = ScopedExtension & Blockly.Block

const scopedMixin: ScopedExtension = {
    isScoped_: true,
    scope: "",
    setScope: function (scope) {
        this.scope = scope
    }
}

Blockly.Extensions.register('scoped', function (this: ScopedBlock) {
    this.mixin(scopedMixin);
});