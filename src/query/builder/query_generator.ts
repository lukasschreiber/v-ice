import * as Blockly from "blockly/core";
import { Order as JsOrder } from 'blockly/javascript';
import { QueryNode, QueryNodeInput, QueryOperation, QueryTree } from "./query_tree";
import { Blocks } from "@/blocks";
import { bfsWithDependencies } from "@/utils/nodes";
import { NodeBlock } from "@/blocks/extensions/node";

export const Order = JsOrder

type GeneratorFn<B, T, R extends QueryNode | QueryOperation> = (block: B, generator: T) => R

export type NodeGeneratorFn<B extends Blockly.Block, R extends QueryNode> = GeneratorFn<B, LanguageAgnosticQueryGenerator, R>
export type OperationGeneratorFn<B extends Blockly.Block, R extends QueryOperation> = GeneratorFn<B, LanguageAgnosticQueryGenerator, R>

export class LanguageAgnosticQueryGenerator {
    ROOT_NODE = "root"

    constructor() {
        
    }

    public registerNode<B extends Blockly.Block, R extends QueryNode>(name: string, generator: GeneratorFn<B, LanguageAgnosticQueryGenerator, R>) {
        if (this.nodeSnippets[name]) {
            throw new Error(`Node ${name} already registered`)
        }

        console.log("Registering node", name)
        // TODO: Types are strange...
        this.nodeSnippets[name] = generator as unknown as GeneratorFn<Blockly.Block, LanguageAgnosticQueryGenerator, QueryNode>
    }

    public registerOperation<B extends Blockly.Block, R extends QueryOperation>(name: string, generator: GeneratorFn<B, LanguageAgnosticQueryGenerator, R>) {
        if (this.operationSnippets[name]) {
            throw new Error(`Operation ${name} already registered`)
        }
        this.operationSnippets[name] = generator as unknown as GeneratorFn<Blockly.Block, LanguageAgnosticQueryGenerator, QueryOperation>
    }

    public processEdgeConnectionPoint(inputName: string, block: NodeBlock): QueryNodeInput | QueryNodeInput[] {
        const connection = block.edgeConnections.get(inputName);
    
        const connections = connection?.connections
            .map(conn => {
                const targetBlock = conn.getSourceBlock().id === block.id ? conn.targetBlock() : conn.getSourceBlock();
    
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
            sets: subsetBlocks.map(block => this.nodeSnippets[Blocks.Names.NODE.SUBSET](block, this)),
            targets: targetBlocks.map(block => this.nodeSnippets[Blocks.Names.NODE.TARGET](block, this))
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

    private nodeSnippets: Record<string, GeneratorFn<Blockly.Block, LanguageAgnosticQueryGenerator, QueryNode>> = {}
    private operationSnippets: Record<string, GeneratorFn<Blockly.Block, LanguageAgnosticQueryGenerator, QueryOperation>> = {}
}

export const languageAgnosticQueryGenerator = new LanguageAgnosticQueryGenerator()