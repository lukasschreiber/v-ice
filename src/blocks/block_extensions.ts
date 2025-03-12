import { debug } from "@/utils/logger";
import * as Blockly from "blockly/core"

/**
 * A block extension that can be registered with Blockly.
 * 
 * Block extensions are used to add additional functionality to blocks, such as mixins or custom properties.
 * To create a block extension, extend this class and implement at least the `extension` method.
 * To register the extension with Blockly, call the `register` method, this is usually done in the `registerBlock` method of a block definition, which manages block extension instances.
 */
export abstract class BlockExtension<T extends Blockly.Block> {
    /**
     * The name of the extension, this should be unique across extensions and mutators.
     */
    public name: string

    constructor(name: string) {
        this.name = name
    }

    /**
     * The extension function that is called when the extension is applied to a block.
     * @param this The block the extension is applied to.
     */
    abstract extension(this: T): void

    /**
     * Registers the extension with Blockly.
     * If the extension is already registered, it will be unregistered first. This happens without warning and can overwrite other extensions as well as default extensions.
     * To avoid this, make sure to use unique names for extensions.
     */
    public register(): void {
        const outerThis = this
        if (Blockly.Extensions.isRegistered(this.name)) Blockly.Extensions.unregister(this.name);

        debug("Registering extension", this.name).addVariable("Name", this.name).log()

        Blockly.Extensions.register(
            this.name,
            function (this: Blockly.Block) { outerThis.extensionFunction.call(outerThis, this as T) }
        )
    }

    /**
     * The extension function is the actual function that is called when the extension is applied to a block.
     * This first collects the mixin properties, applies them and then executes the overwritten extension function.
     * 
     * @param block The block the extension is applied to. 
     */
    private extensionFunction(block: T) {
        const mixinProperties = this.collectMixinProperties()
        if (mixinProperties) block.mixin(mixinProperties, true)

        if (this.extension) {
            this.extension.call(block)
        }
    }

    /**
     * Collects the mixin properties from the extension.
     * Those are all properties that are decorated with the `mixin` decorator.
     * 
     * @returns The mixin properties or undefined if no properties are found.
     */
    protected collectMixinProperties() {
        const mixinPropertyKeys = Reflect.get(this, "mixinProperties") as PropertyKey[] | undefined
        if (mixinPropertyKeys && mixinPropertyKeys.length > 0) {
            const mixinProperties: Record<PropertyKey, any> = {}
            for (const mixinPropertyKey of mixinPropertyKeys) {
                const propertyValue = Reflect.get(this, mixinPropertyKey)
                mixinProperties[mixinPropertyKey] = propertyValue
            }

            return mixinProperties
        }

        return undefined
    }

    /**
     * Decorator to mark a property as a mixin property.
     * A class member or method that is decorated with this decorator will be mixed into the block when the extension is applied.
     * 
     * @param target The target class or prototype.
     * @param context The context of the decorated member or method.
     */
    public static mixin(target: any, context: ClassMemberDecoratorContext | ClassMethodDecoratorContext<any>) {
        if (!target.mixinProperties) {
            target.mixinProperties = []
        }

        target.mixinProperties.push(context)
    }
}

/**
 * All keys of class members or methods that are decorated with the `mixin` decorator.
 * 
 * @template T The class type.
 * @template U The block extension type.
 */
export type MixinKeys<T, U extends BlockExtension<any>> = T extends { constructor: Function }
    ? keyof {
        [K in keyof T as K extends string | symbol
        ? K extends Exclude<keyof T, keyof U>
        ? K
        : never
        : never]: T[K];
    }
    : never;

/**
 * All properties to be mixed in. This relys on the MixinKeys type to extract the properties from the mixin.
 * 
 * @template T The mixin type.
 * @template U The block extension type.
 */
export type MixinProperties<T, U extends BlockExtension<any>> = {
    [K in MixinKeys<ExtractInterface<T>, U>]: ExtractInterface<T>[K extends keyof ExtractInterface<T> ? K : never];
};

/**
 * Extracts the instance type of a class.
 */
type ExtractInterface<T> = T extends { new(...args: any[]): infer I } ? I : never;

/**
 * Converts a union type to an intersection type.
 */
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

/**
 * A registrable extension that can be used to create block extensions.
 */
export type RegistrableExtension = new (...args: any[]) => BlockExtension<any>

/**
 * Combines the signature of multiple extensions into one.
 * 
 * This is useful to get the type of a block with multiple extensions applied.
 * 
 * @template Es The extension types.
 */
export type ExtensionMixins<Es extends RegistrableExtension[]> = UnionToIntersection<
    Es extends (infer E)[]
    ? E extends RegistrableExtension
    ? MixinExtensionProperties<E>
    : never
    : never
>;

/**
 * Extracts the properties of a mixin.
 * 
 * Note that this type only takes the difference between a BlockExtension implementation and the BlockExtension class.
 * This means that custom properties on the implementation that are not actually mixed in will be included nevertheless.
 * @template T The mixin type.
 */
export type MixinExtensionProperties<T> = MixinProperties<T, BlockExtension<any>>;
