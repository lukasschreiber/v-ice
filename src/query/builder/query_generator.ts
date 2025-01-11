import * as Blockly from "blockly/core";
import { QueryNode, QueryNodeInput, QueryOperation, QueryTree } from "./query_tree";
import { Blocks } from "@/blocks";
import { bfsWithDependencies } from "@/utils/nodes";
import { NodeBlock } from "@/blocks/extensions/node";
import { AnyRegistrableBlock, BlockFieldNames, BlockInputNames, BlockLinesDefinition, ConnectionPointNames } from "@/blocks/block_definitions";
import types from "@/data/types";

type GeneratorFn<B extends Blockly.Block, T, S extends ScopeQueryGenerator<B>, R extends QueryNode | QueryOperation> = (block: B, scope: S, generator: T) => R

export type NodeGeneratorFn<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends NodeBlock, R extends QueryNode> = GeneratorFn<B, QueryGenerator, NodeBlockQueryGenerator<L, D, B>, R>
export type OperationGeneratorFn<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block, R extends QueryOperation> = GeneratorFn<B, QueryGenerator, BlockQueryGenerator<L, D, B>, R>

export class QueryGenerator {
    ROOT_NODE = "root"

    public registerNode<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends NodeBlock, R extends QueryNode>(name: string, definition: D, generator: GeneratorFn<B, QueryGenerator, NodeBlockQueryGenerator<L, D, B>, R>) {
        if (this.nodeSnippets[name]) {
            throw new Error(`Node ${name} already registered`)
        }

        console.log("Registering node", name)
        // TODO: Types are strange...
        this.nodeSnippets[name] = generator as unknown as GeneratorFn<B, QueryGenerator, NodeBlockQueryGenerator<L, D, B>, R>
        this.definitions[name] = definition
    }

    public registerOperation<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block, R extends QueryOperation>(name: string, definition: D, generator: GeneratorFn<B, QueryGenerator, BlockQueryGenerator<L, D, B>, R>) {
        if (this.operationSnippets[name]) {
            throw new Error(`Operation ${name} already registered`)
        }
        this.operationSnippets[name] = generator as unknown as GeneratorFn<B, QueryGenerator, BlockQueryGenerator<L, D, B>, R>
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
        return generator(block, new NodeBlockQueryGenerator(this.definitions[block.type], block), this)
    }

    private nodeSnippets: Record<string, GeneratorFn<any, QueryGenerator, NodeBlockQueryGenerator<any[], any, any>, QueryNode>> = {}
    private operationSnippets: Record<string, GeneratorFn<any, QueryGenerator, BlockQueryGenerator<any[], any, any>, QueryOperation>> = {}
    private definitions: Record<string, AnyRegistrableBlock<any>> = {}
}

interface ScopeQueryGenerator<B extends Blockly.Block> {
    block: B
}

export class BlockQueryGenerator<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block> implements ScopeQueryGenerator<B> {
    constructor(public definition: D, public block: B) { }

    public generateForInput(_name: BlockInputNames<L, D>): QueryOperation {
        return {
            name: this.definition.id,
            args: {
                name: types.boolean
            }
        }
    }

    public generateForField(_name: BlockFieldNames<L, D>): QueryOperation {
        return {
            name: this.definition.id,
            args: {
                name: types.boolean
            }
        }
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