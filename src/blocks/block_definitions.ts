import { IType } from "@/data/types"
import * as Blockly from "blockly/core"
import { BlockExtension, ExtensionMixins, RegistrableExtension } from "@/blocks/block_extensions"
import { MutatorMixin, RegistrableMutator } from "./block_mutators"
import { NodeExtension, NodeBlockExtension } from "./extensions/node"
import { getASTBuilderInstance } from "@/query/builder/ast_builder_instance"
import { BlockASTBuilder, NodeBlockASTBuilder } from "@/query/builder/ast_builder"
import { ASTOperationNode, ASTPrimitiveNode, ASTSetNode } from "@/query/builder/ast"

// This is needed because currently blockly defines BlockDefinition as any, see this Github Issue:
// https://github.com/google/blockly/issues/6828
// All functions of Block need to be called with ! because they always exist although typescript does not know that
export type BlocklyBlockDefinition = { [Property in keyof Blockly.Block]?: Blockly.Block[Property] } & { [key: string]: unknown }

/**
 * Registers a block in Blockly using the jsonInit method
 * All mutators and extensions are registered if they are not already
 * 
 * This should not be called manually but instead through the createBlock function
 * 
 * @param block the block to register
 */
export function registerBlock<Es extends RegistrableExtension[], M extends RegistrableMutator, L extends BlockLinesDefinition, T extends RegistrableBlock<Es, M, L>>(block: T): void {
    const definition = convertBlockDefinitionToBlocklyJson<Es, M, L, T>(block)
    if (definition.output && typeof definition.output !== "string") definition.output = definition.output.name
    for (const key in definition) {
        if (key.startsWith("args")) {
            for (const arg of definition[key as keyof BlocklyJsonBlockDefinition] as (FieldDefinition | InputDefinition)[]) {
                if (arg.check && typeof arg.check !== "string") {
                    arg.check = (arg.check as IType).name
                }
            }
        }
    }
    const blockDefinition: BlocklyBlockDefinition = {
        init: function () {
            this.jsonInit!(definition)
            if (definition.data) {
                this.data = JSON.stringify(definition.data)
            }
        },
    }

    console.log("Registering block", definition.id)
    Blockly.Blocks[definition.id] = blockDefinition
}

/**
 * A connection type for a block
 * This is used for the notch type of the block
 */
export enum ConnectionType {
    BOOLEAN = "Boolean",
    TIMELINE_PROTOTYPE = "TimelinePrototype",
}

/**
 * Converts a block definition to the plain Blockly JSON format
 * 
 * @param block The block definition 
 * @returns The plain Blockly JSON format
 */
function convertBlockDefinitionToBlocklyJson<Es extends RegistrableExtension[], M extends RegistrableMutator, L extends BlockLinesDefinition, T extends RegistrableBlock<Es, M, L>>(block: T): BlocklyJsonBlockDefinition {

    const extensions: string[] = []
    let mutatorName: string | undefined = undefined

    for (const extension of block.extensions ?? []) {
        const ext = getExtensionInstance(extension)
        if (!Blockly.Extensions.isRegistered(ext.name)) {
            ext.register()
        }
        extensions.push(ext.name)
    }

    if (block.mutator) {
        const mutator = getExtensionInstance(block.mutator)
        if (!Blockly.Extensions.isRegistered(mutator.name)) {
            mutator.register()
        }
        mutatorName = mutator.name
    }

    if (block.code) {
        // TODO this could probably have nicer types but at the moment it's not worth the effort

        if (extensions.includes(getExtensionInstance(NodeBlockExtension).name)) {
            getASTBuilderInstance().registerNode(block.id, block, block.code as (...args: any[]) => ASTSetNode)
        } else {
            getASTBuilderInstance().registerOperation(block.id, block, block.code as (...args: any[]) => ASTOperationNode | ASTPrimitiveNode)
        }
    }

    const result: BlocklyJsonBlockDefinition = {
        data: block.data,
        style: block.style,
        helpUrl: block.helpUrl,
        tooltip: block.tooltip,
        inputsInline: block.inputsInline,
        output: block.output,
        extensions: extensions,
        mutator: mutatorName,
        id: block.id!,
        previousStatement: block.connectionType !== undefined ? block.connectionType : block.previousStatement,
        nextStatement: block.connectionType !== undefined ? block.connectionType : block.nextStatement,
        colour: block.color,
    }

    if (block.lines) {
        for (let i = 0; i < block.lines.length; i++) {
            const line = block.lines[i]
            result[`message${i}`] = line.text
            result[`args${i}`] = line.args
            if (line.align) result[`implicitAlign${i}`] = line.align
        }
    }

    return result
}

const extensionInstances: Record<string, BlockExtension<any>> = {}

/**
 * Creates a new instance of an extension if it does not exist yet
 * 
 * @param extension The extension class
 * @returns The extension instance
 */
function getExtensionInstance<T extends BlockExtension<any>>(extension: new (...args: any[]) => T): T {
    const constructorName = extension.name
    if (!extensionInstances[constructorName]) {
        extensionInstances[constructorName] = new extension()
    }
    return extensionInstances[constructorName] as T
}

/**
 * A block definition in the Blockly JSON format (Blockly currently lacks types for this)
 */
type BlocklyJsonBlockDefinition = {
    [key: `message${number}`]: string
    [key: `args${number}`]: (FieldDefinition | InputDefinition)[]
    [key: `implicitAlign${number}`]: "RIGHT" | "CENTRE" | "LEFT"
    colour?: number | string
    nextStatement?: null | string | string[]
    previousStatement?: null | string | string[]
    output?: IType | string
    inputsInline?: boolean
    tooltip?: string
    style?: string
    helpUrl?: string
    mutator?: string
    extensions?: string[]
    id: string
    data?: object | string
}

/**
 * A block line definition
 * This is the equivalent of a message${number} and args${number} in the Blockly JSON format
 * 
 * @param text The text of the block line
 * @param args The arguments of the block line
 * @param align The alignment of the block line, note the british spelling which is taken from Blockly
 */
export interface BlockLineDefinition {
    text: string
    args: (FieldDefinition | InputDefinition)[]
    align?: "RIGHT" | "CENTRE" | "LEFT"
}

/**
 * A list of block line definitions
 */
export type BlockLinesDefinition = BlockLineDefinition[]

/**
 * A block that can be registered in Blockly
 * Note: this definition must first be converted to the plain Blockly JSON format before it can be registered
 * 
 * TODO: I think that the code function triggers some weird typescript bug.
 * It works most of the time but if I edit something in query_generator.ts it sometimes stops working.
 * 
 * @param Es The extensions that can be applied to the block
 * @param M The mutator that can be applied to the block
 * @param L The lines of the block
 * 
 * @returns The block definition
 */
export interface RegistrableBlock<
    Es extends RegistrableExtension[],
    M extends RegistrableMutator,
    L extends BlockLinesDefinition,
> {
    // The unique id of the block, for example "math_number"
    id: string
    // The color of the block, for example "#ff0000"
    color?: number | string
    // A url to the help page of the block, starting with "#"
    helpUrl?: string
    // The lines of the block
    lines: L
    // The type of the bottom connection, this determines the type of notch that is rendered
    nextStatement?: null | string | string[]
    // The type of the top connection, this determines the type of notch that is rendered
    previousStatement?: null | string | string[]
    // The type of connection type, this sets both the top and bottom connection type
    connectionType?: string
    // The output type of the block, only used if a block returns a value other than boolean, therefore this is mutually exclusive with nextStatement and previousStatement (or connectionType)
    output?: IType | string
    // Whether the inputs should be inline
    inputsInline?: boolean
    // The tooltip of the block
    tooltip?: string
    // The style of the block
    style?: string
    // A mutator class that can be used to modify the block
    mutator?: M
    // A list of extension classes to be applied
    extensions?: Es
    // Additional optional data that can be attached to the block
    data?: object | string
    // A function that converts the block to an AST node
    code?: (
        scope: MatchAny<Es, typeof NodeBlockExtension> extends true ? NodeBlockASTBuilder<L, AnyRegistrableBlock<L>, Blockly.BlockSvg & ExtensionMixins<Es> & MutatorMixin<M> & NodeExtension> : BlockASTBuilder<L, AnyRegistrableBlock<L>, Blockly.BlockSvg & ExtensionMixins<Es> & MutatorMixin<M>>,
    ) => MatchAny<Es, typeof NodeBlockExtension> extends true ? ASTSetNode : ASTOperationNode | ASTPrimitiveNode
}

/**
 * A field definition
 */
export type FieldDefinition = {
    type: `field_${string}`
    name: string
    [key: string]: unknown
}

/**
 * An input definition
 */
export type InputDefinition = {
    type: `input_${string}`
    name: string
    check?: IType | string
}

/**
 * Creates a new block from a block definition
 * The new block is immediately registered in Blockly
 * 
 * @param definition The block definition
 * @returns The block definition again to be used e.g. in a toolbox
 */
export function createBlock<
    Es extends RegistrableExtension[] = never[],
    M extends RegistrableMutator = never,
    L extends BlockLinesDefinition = never,
>(definition: RegistrableBlock<Es, M, L>): RegistrableBlock<Es, M, L> {
    registerBlock<Es, M, L, RegistrableBlock<Es, M, L>>(definition)
    return definition
}

/**
 * A utility type to check if a type U is a valid array element of T
 * This does sometimes result in `boolean` or `never`, see `ReduceToTrue` and `NotNever` and `MatchAny` for a better type
 * 
 * @param T The array type
 * @param U The type to check
 */
type Match<T, U> = T extends (infer R)[] ? R extends U ? true : false : false
/**
 * A utility type to reduce a boolean to true
 * If a type is `true` the result is `true`, if a type is `false` the result is `false`, if a type is `true | false`, or a `boolean` the result is `true`, otherwise the result is the type itself
 * 
 * @param T The type to reduce
 */
type ReduceToTrue<T> = [T] extends [true] ? true : [T] extends [false] ? false : [T] extends [true | false] ? true : T;
/**
 * A utility type to check if a type is not `never`
 * This return the type itself if it is not `never`, otherwise it returns `false`
 * 
 * @param T The type to check
 */
type NotNever<T> = [T] extends [never] ? false : T;
/**
 * A utility type to check if a type U is a valid array element of T
 * 
 * @param T The type to check
 */
type MatchAny<T, U> = ReduceToTrue<NotNever<Match<T, U>>>;

/**
 * A type representing any block that can be registered
 * This is a union of all possible combination of any and never for the extensions and mutator
 * 
 * While the extensions and mutators are not relevant in many cases, the lines are, so this type only keeps the lines as a generic parameter
 * 
 * @param L The lines of the block
 */
export type AnyRegistrableBlock<L extends BlockLinesDefinition> = RegistrableBlock<any[], any, L> | RegistrableBlock<never[], never, L> | RegistrableBlock<any[], never, L> | RegistrableBlock<never[], any, L>

/**
 * A union of all field names of a block
 * This relies on the `field` prefix of the field type (which is standard in Blockly)
 * 
 * @param L The lines of the block
 * @param T The block type
 */
export type BlockFieldNames<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> =
    T["lines"] extends Array<{ args: Array<infer U> }>
    ? U extends { type: `field_${string}`, name: string }
    ? U["name"]
    : never
    : never;

/**
 * A union of all input names of a block
 * This relies on the `input` prefix of the input type (which is standard in Blockly)
 * 
 * @param L The lines of the block
 * @param T The block type
 */
export type BlockInputNames<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> =
    T["lines"] extends Array<{ args: Array<infer U> }>
    ? U extends { type: `input_${string}`, name: string }
    ? U["name"]
    : never
    : never;

/**
 * A union of all field or input names of a block that have a specific type
 * 
 * @param L The lines of the block
 * @param T The block type
 * @param FieldType The specific type to filter
 */
export type BlockFieldByType<
    L extends BlockLinesDefinition,
    T extends AnyRegistrableBlock<L>,
    FieldType extends string // The specific type to filter
> = T["lines"] extends Array<{ args: Array<infer U> }>
    ? U extends { type: `${FieldType}`, name: string }
    ? U["name"]
    : never
    : never;

/**
 * A union of all connection point names of a block
 * 
 * @param L The lines of the block
 * @param T The block type
 */
export type ConnectionPointNames<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> = BlockFieldByType<L, T, "field_edge_connection">

/**
 * A union of all statement input names of a block
 * 
 * @param L The lines of the block
 * @param T The block type
 */
export type StatementInputTypeNames<L extends BlockLinesDefinition, T extends AnyRegistrableBlock<L>> = BlockFieldByType<L, T, "input_statement">