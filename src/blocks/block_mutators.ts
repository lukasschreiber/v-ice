import * as Blockly from "blockly/core"
import { BlockExtension, MixinProperties } from "./block_extensions"
import { debug } from "@/utils/logger"

/**
 * A block mutator that can be registered with Blockly.
 * 
 * Block mutators are used to add additional functionality to blocks, such as mixins or custom properties.
 * To create a block mutator, extend this class.
 */
export abstract class BlockMutator<T extends Blockly.Block, S = {}> extends BlockExtension<T> {
 
    constructor(name: string) {
        super(name)
    }

    /**
     * Gets the mutator object that is used to register the mutator with Blockly.
     * This includes default implementations for the mutator functions as well as all mixin properties.
     * 
     * @returns The mutator object that is used to register the mutator with Blockly.
     */
    public mutator() {
        return {
            ...this.collectMixinProperties(),
            mutationToDom: this.mutationToDom,
            domToMutation: this.domToMutation,
            saveExtraState: this.saveExtraState,
            loadExtraState: this.loadExtraState
        }
    }

    /**
     * The extension function that is called when the mutator is applied to a block.
     * @param this The block the mutator is applied to.
     */
    public extension(this: T) { }

    /**
     * Converts the mutation of the block to a DOM element.
     * 
     * @param this The block the mutator is applied to.
     * @returns The DOM element that represents the mutation of the block.
     */
    public mutationToDom(this: T): Element | null {
        return null
    }
    
    /**
     * Converts a DOM element to a mutation of the block.
     * 
     * @param this The block the mutator is applied to.
     * @param xmlElement The DOM element that represents the mutation of the block.
     */
    public domToMutation(this: T, _xmlElement: Element): void { }

    /**
     * Saves the extra state of the block to a serializable object.
     * 
     * @param this The block the mutator is applied to.
     * @returns The serializable object that represents the extra state of the block.
     */
    public saveExtraState(this: T): S {
        return {} as S
    }

    /**
     * Loads the extra state of the block from a serializable object.
     * 
     * @param this The block the mutator is applied to.
     * @param state The serializable object that represents the extra state of the block.
     */
    public loadExtraState(this: T, _state: S): void { }

    /**
     * Registers the mutator with Blockly.
     * If the mutator is already registered, it will be unregistered first. This happens without warning and can overwrite other mutators as well as default mutators.
     * To avoid this, make sure to use unique names for mutators.
     */
    public register(): void {
        if (Blockly.Extensions.isRegistered(this.name)) Blockly.Extensions.unregister(this.name);

        debug("Registering mutator", this.name).addVariable("Name", this.name).log()
        // we do not use the extensionFunction here because we cannot mixin properties directly
        Blockly.Extensions.registerMutator(
            this.name,
            this.mutator(),
            this.extension
        )
    }
}

/**
 * All mixed in properties of a block mutator.
 */
export type MixinMutatorProperties<T> = MixinProperties<T, BlockMutator<any>>

/**
 * A registrable block mutator.
 */
export type RegistrableMutator = new (...args: any[]) => BlockMutator<any>

/**
 * The signature of a block with a mutator mixin.
 * 
 * @param M The type of the mutator.
 */
export type MutatorMixin<M extends RegistrableMutator> = MixinMutatorProperties<M>
