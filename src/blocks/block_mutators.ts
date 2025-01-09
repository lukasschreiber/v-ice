import * as Blockly from "blockly/core"
import { BlockExtension } from "./block_extensions"

export abstract class BlockMutator<T extends Blockly.Block, S> extends BlockExtension<T> {
 
    constructor(name: string) {
        super(name)
    }

    public mutator() {
        return {
            ...this.collectMixinProperties(),
            mutationToDom: this.mutationToDom,
            domToMutation: this.domToMutation,
            saveExtraState: this.saveExtraState,
            loadExtraState: this.loadExtraState
        }
    }

    public extension(this: T) { }

    public mutationToDom(this: T): Element | null {
        return null
    }
    
    public domToMutation(this: T, xmlElement: Element): void { }

    public saveExtraState(this: T): S {
        return {} as S
    }

    public loadExtraState(this: T, state: S): void { }

    public register(): void {
        if (Blockly.Extensions.isRegistered(this.name)) Blockly.Extensions.unregister(this.name);

        // we do not use the extensionFunction here because we cannot mixin properties directly
        Blockly.Extensions.registerMutator(
            this.name,
            this.mutator,
            this.extension
        )
    }
}