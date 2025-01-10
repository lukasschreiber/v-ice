import * as Blockly from "blockly/core"

export abstract class BlockExtension<T extends Blockly.Block> {
    public name: string

    constructor(name: string) {
        this.name = name
    }

    abstract extension(this: T): void

    public register(): void {
        const outerThis = this
        if (Blockly.Extensions.isRegistered(this.name)) Blockly.Extensions.unregister(this.name);

        console.log("Registering extension", this.name)

        Blockly.Extensions.register(
            this.name,
            function (this: Blockly.Block) { outerThis.extensionFunction.call(outerThis, this as T) }
        )
    }

    private extensionFunction(block: T) {
        const mixinProperties = this.collectMixinProperties()
        if (mixinProperties) block.mixin(mixinProperties, true)

        if (this.extension) {
            this.extension.call(block)
        }
    }

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

    public static mixin(target: any, context: ClassMemberDecoratorContext | ClassMethodDecoratorContext<any>) {
        if (!target.mixinProperties) {
            target.mixinProperties = []
        }

        target.mixinProperties.push(context)
    }
}

export type MixinKeys<T, U extends BlockExtension<any>> = T extends { constructor: Function }
    ? keyof {
        [K in keyof T as K extends string | symbol
        ? K extends Exclude<keyof T, keyof U>
        ? K
        : never
        : never]: T[K];
    }
    : never;

export type MixinProperties<T, U extends BlockExtension<any>> = {
    [K in MixinKeys<ExtractInterface<T>, U>]: ExtractInterface<T>[K extends keyof ExtractInterface<T> ? K : never];
};

type ExtractInterface<T> = T extends { new(...args: any[]): infer I } ? I : never;

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

export type RegistrableExtension = new (...args: any[]) => BlockExtension<any>

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
