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
        Blockly.Extensions.register(
            this.name,
            function (this: Blockly.Block) { outerThis.extensionFunction.call(outerThis, this as T) }
        )
    }

    private extensionFunction(block: T) {
       const mixinProperties = this.collectMixinProperties()
         if (mixinProperties) block.mixin(mixinProperties)
        
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