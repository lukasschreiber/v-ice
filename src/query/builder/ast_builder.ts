import * as Blockly from "blockly/core";
import { Blocks } from "@/blocks";
import { bfsWithDependencies } from "@/utils/nodes";
import { NodeBlock } from "@/blocks/extensions/node";
import { AnyRegistrableBlock, BlockFieldNames, BlockInputNames, BlockLinesDefinition, ConnectionPointNames, StatementInputTypeNames } from "@/blocks/block_definitions";
import { AST, ASTNode, ASTNodeInput, ASTOperation, ASTPrimitive } from "./ast";

type GeneratorFn<B extends Blockly.Block, S extends ScopeASTBuilder<B>, R extends ASTNode | ASTOperation | ASTPrimitive> = (scope: S) => R

export type NodeGeneratorFn<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends NodeBlock, R extends ASTNode> = GeneratorFn<B, NodeBlockASTBuilder<L, D, B>, R>
export type OperationGeneratorFn<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block, R extends ASTOperation | ASTPrimitive> = GeneratorFn<B, BlockASTBuilder<L, D, B>, R>

export class ASTBuilder {
    ROOT_NODE = "root"

    public registerNode<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends NodeBlock, R extends ASTNode>(name: string, definition: D, generator: GeneratorFn<B, NodeBlockASTBuilder<L, D, B>, R>) {
        if (this.nodeSnippets[name]) {
            throw new Error(`Node ${name} already registered`)
        }

        console.log("Registering node", name)
        // TODO: Types are strange...
        this.nodeSnippets[name] = generator as unknown as GeneratorFn<B, NodeBlockASTBuilder<L, D, B>, R>
        this.definitions[name] = definition
    }

    public registerOperation<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block, R extends ASTOperation>(name: string, definition: D, generator: GeneratorFn<B, BlockASTBuilder<L, D, B>, R>) {
        if (this.operationSnippets[name]) {
            throw new Error(`Operation ${name} already registered`)
        }
        this.operationSnippets[name] = generator as unknown as GeneratorFn<B, BlockASTBuilder<L, D, B>, R>
        this.definitions[name] = definition
    }

    public build(workspace: Blockly.Workspace): AST {
        const root = workspace.getBlocksByType(Blocks.Names.NODE.SOURCE)?.[0]
        if (!root) {
            return this.emptyAST()
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
            sets: subsetBlocks.map(block => this.buildASTForNode(block)),
            targets: targetBlocks.map(block => this.buildASTForNode(block))
        }
    }

    public emptyAST(): AST {
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

    public buildASTForNode<
        L extends BlockLinesDefinition,
        B extends NodeBlock,
        R extends ASTNode
    >(block: B) {
        const generator = this.nodeSnippets[block.type] as NodeGeneratorFn<L, AnyRegistrableBlock<L>, B, R>
        return generator(new NodeBlockASTBuilder(this.definitions[block.type], block, this))
    }

    public buildASTForOperationBlock<
        L extends BlockLinesDefinition,
        B extends Blockly.Block,
        R extends ASTOperation | ASTPrimitive
    >(block: B) {
        const generator = this.operationSnippets[block.type] as OperationGeneratorFn<L, AnyRegistrableBlock<L>, B, R>
        if (!generator) {
            throw new Error(`No generator found for block ${block.type}`)
        }
        return generator(new BlockASTBuilder(this.definitions[block.type], block, this))
    }

    private nodeSnippets: Record<string, GeneratorFn<any, NodeBlockASTBuilder<any[], any, any>, ASTNode>> = {}
    private operationSnippets: Record<string, GeneratorFn<any, BlockASTBuilder<any[], any, any>, ASTOperation | ASTPrimitive>> = {}
    private definitions: Record<string, AnyRegistrableBlock<any>> = {}
}

interface ScopeASTBuilder<B extends Blockly.Block> {
    block: B
}

export class BlockASTBuilder<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block> implements ScopeASTBuilder<B> {
    constructor(public definition: D, public block: B, public generator: ASTBuilder) { }

    public buildASTForInput(name: BlockInputNames<L, D>): ASTOperation | ASTPrimitive {
        const input = this.block.getInput(name);
        if (!input) {
            throw ReferenceError(`Input "${name}" doesn't exist on "${this.block.type}"`);
        }

        const targetBlock = input.connection?.targetBlock();

        if (!targetBlock) {
            return { value: this.block.getFieldValue(name) }
        }

        return this.generator.buildASTForOperationBlock(targetBlock);
    }

    public buildASTForUnknownInput(name: BlockInputNames<L, D> | string): ASTOperation | ASTPrimitive {
        return this.buildASTForInput(name as BlockInputNames<L, D>);
    }

    public buildASTForField(name: BlockFieldNames<L, D>, fn: (value: string) => ASTPrimitive["value"] = (value) => value): ASTOperation | ASTPrimitive {
        return { value: fn(this.block.getFieldValue(name)) }
    }

    public buildASTForUnknownStatementInput(name: StatementInputTypeNames<L, D> | string): (ASTOperation | ASTPrimitive)[] {
        return this.buildASTForStatementInput(name as StatementInputTypeNames<L, D>);
    }

    public buildASTForStatementInput(name: StatementInputTypeNames<L, D>): ASTOperation[] {
        let targetBlock = this.block.getInputTargetBlock(name);
        if (!targetBlock && !this.block.getInput(name)) {
            throw ReferenceError(`Input "${name}" doesn't exist on "${this.block.type}"`);
        }

        const segments: ASTOperation[] = []
        while (targetBlock) {
            const segment = this.generator.buildASTForOperationBlock(targetBlock);
            if ((segment as ASTPrimitive).value) {
                throw new Error(`Unexpected primitive value in statement input ${name}`)
            }

            segments.push(segment as ASTOperation);
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

export class NodeBlockASTBuilder<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends NodeBlock> extends BlockASTBuilder<L, D, B> {

    public buildASTForConnectionPoint(inputName: ConnectionPointNames<L, D>): ASTNodeInput | ASTNodeInput[] {
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
            .filter(Boolean) as ASTNodeInput[];

        return connections?.length ? (connections.length === 1 ? connections[0] : connections) : [];
    }
}