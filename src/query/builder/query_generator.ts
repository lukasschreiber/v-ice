import * as Blockly from "blockly/core";
import { QueryNode, QueryNodeInput, QueryOperation, QueryPrimitive, QueryTree } from "./query_tree";
import { Blocks } from "@/blocks";
import { bfsWithDependencies } from "@/utils/nodes";
import { NodeBlock } from "@/blocks/extensions/node";
import { AnyRegistrableBlock, BlockFieldNames, BlockInputNames, BlockLinesDefinition, ConnectionPointNames, StatementInputTypeNames } from "@/blocks/block_definitions";

type GeneratorFn<B extends Blockly.Block, S extends ScopeQueryGenerator<B>, R extends QueryNode | QueryOperation | QueryPrimitive> = (scope: S) => R

export type NodeGeneratorFn<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends NodeBlock, R extends QueryNode> = GeneratorFn<B, NodeBlockQueryGenerator<L, D, B>, R>
export type OperationGeneratorFn<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block, R extends QueryOperation | QueryPrimitive> = GeneratorFn<B, BlockQueryGenerator<L, D, B>, R>

export class QueryGenerator {
    ROOT_NODE = "root"

    public registerNode<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends NodeBlock, R extends QueryNode>(name: string, definition: D, generator: GeneratorFn<B, NodeBlockQueryGenerator<L, D, B>, R>) {
        if (this.nodeSnippets[name]) {
            throw new Error(`Node ${name} already registered`)
        }

        console.log("Registering node", name)
        // TODO: Types are strange...
        this.nodeSnippets[name] = generator as unknown as GeneratorFn<B, NodeBlockQueryGenerator<L, D, B>, R>
        this.definitions[name] = definition
    }

    public registerOperation<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block, R extends QueryOperation>(name: string, definition: D, generator: GeneratorFn<B, BlockQueryGenerator<L, D, B>, R>) {
        if (this.operationSnippets[name]) {
            throw new Error(`Operation ${name} already registered`)
        }
        this.operationSnippets[name] = generator as unknown as GeneratorFn<B, BlockQueryGenerator<L, D, B>, R>
        this.definitions[name] = definition
    }

    public generateQuery(workspace: Blockly.Workspace): QueryTree {
        const root = workspace.getBlocksByType(Blocks.Names.NODE.SOURCE)?.[0]
        if (!root) {
            return this.emptyQuery()
        }

        const sortedNodes = bfsWithDependencies(root as NodeBlock)

        const subsetBlocks = sortedNodes.filter(block => block.type === Blocks.Names.NODE.SUBSET)
        const targetBlocks = sortedNodes.filter(block => block.type === Blocks.Names.NODE.TARGET)

        return {
            root: {
                id: root.id,
                attributes: {
                    name: this.ROOT_NODE
                }
            },
            sets: subsetBlocks.map(block => this.generateForNode(block)),
            targets: targetBlocks.map(block => this.generateForNode(block))
        }
    }

    public emptyQuery(): QueryTree {
        return {
            root: {
                id: this.ROOT_NODE,
                attributes: {
                    name: this.ROOT_NODE
                }
            },
            sets: [],
            targets: []
        }
    }

    public generateForNode<
        L extends BlockLinesDefinition,
        B extends NodeBlock,
        R extends QueryNode
    >(block: B) {
        const generator = this.nodeSnippets[block.type] as NodeGeneratorFn<L, AnyRegistrableBlock<L>, B, R>
        return generator(new NodeBlockQueryGenerator(this.definitions[block.type], block, this))
    }

    public generateForOperationBlock<
        L extends BlockLinesDefinition,
        B extends Blockly.Block,
        R extends QueryOperation | QueryPrimitive
    >(block: B) {
        const generator = this.operationSnippets[block.type] as OperationGeneratorFn<L, AnyRegistrableBlock<L>, B, R>
        if (!generator) {
            throw new Error(`No generator found for block ${block.type}`)
        }
        return generator(new BlockQueryGenerator(this.definitions[block.type], block, this))
    }

    private nodeSnippets: Record<string, GeneratorFn<any, NodeBlockQueryGenerator<any[], any, any>, QueryNode>> = {}
    private operationSnippets: Record<string, GeneratorFn<any, BlockQueryGenerator<any[], any, any>, QueryOperation | QueryPrimitive>> = {}
    private definitions: Record<string, AnyRegistrableBlock<any>> = {}
}

interface ScopeQueryGenerator<B extends Blockly.Block> {
    block: B
}

export class BlockQueryGenerator<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block> implements ScopeQueryGenerator<B> {
    constructor(public definition: D, public block: B, public generator: QueryGenerator) { }

    public generateForInput(name: BlockInputNames<L, D>): QueryOperation | QueryPrimitive {
        const input = this.block.getInput(name);
        if (!input) {
            throw ReferenceError(`Input "${name}" doesn't exist on "${this.block.type}"`);
        }

        const targetBlock = input.connection?.targetBlock();

        if (!targetBlock) {
            return { value: this.block.getFieldValue(name) }
        }

        return this.generator.generateForOperationBlock(targetBlock);
    }

    public generateForUnknownInput(name: BlockInputNames<L, D> | string): QueryOperation | QueryPrimitive {
        return this.generateForInput(name as BlockInputNames<L, D>);
    }

    public generateForField(name: BlockFieldNames<L, D>, fn: (value: string) => QueryPrimitive["value"] = (value) => value): QueryOperation | QueryPrimitive {
        return { value: fn(this.block.getFieldValue(name)) }
    }

    public generateForUnknownStatementInput(name: StatementInputTypeNames<L, D> | string): (QueryOperation | QueryPrimitive)[] {
        return this.generateForStatementInput(name as StatementInputTypeNames<L, D>);
    }

    public generateForStatementInput(name: StatementInputTypeNames<L, D>): QueryOperation[] {
        let targetBlock = this.block.getInputTargetBlock(name);
        if (!targetBlock && !this.block.getInput(name)) {
            throw ReferenceError(`Input "${name}" doesn't exist on "${this.block.type}"`);
        }

        const segments: QueryOperation[] = []
        while (targetBlock) {
            const segment = this.generator.generateForOperationBlock(targetBlock);
            if ((segment as QueryPrimitive).value) {
                throw new Error(`Unexpected primitive value in statement input ${name}`)
            }

            segments.push(segment as QueryOperation);
            targetBlock = targetBlock.getNextBlock();
        }

        return segments;
    }

    public getField<F extends Blockly.Field<any>>(name: BlockFieldNames<L, D>): F {
        return this.block.getField(name) as F
    }

    public getFieldValue(name: BlockFieldNames<L, D>): string {
        return this.block.getFieldValue(name)
    }
}

export class NodeBlockQueryGenerator<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends NodeBlock> extends BlockQueryGenerator<L, D, B> {

    public generateForConnectionPoint(inputName: ConnectionPointNames<L, D>): QueryNodeInput | QueryNodeInput[] {
        const connection = this.block.edgeConnections.get(inputName);

        const connections = connection?.connections
            .map(conn => {
                const targetBlock = conn.getSourceBlock().id === this.block.id ? conn.targetBlock() : conn.getSourceBlock();

                if (!targetBlock || !Blocks.Types.isNodeBlock(targetBlock)) return [];

                return targetBlock.type === Blocks.Names.NODE.SUBSET
                    ? {
                        node: targetBlock.id,
                        output: targetBlock.edgeConnections.get("POSITIVE")?.connections.includes(conn.targetConnection!) ? "positive" : "negative"
                    }
                    : { node: targetBlock.id, output: null };
            })
            .filter(Boolean) as QueryNodeInput[];

        return connections?.length ? (connections.length === 1 ? connections[0] : connections) : [];
    }
}