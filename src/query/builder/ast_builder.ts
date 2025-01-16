import * as Blockly from "blockly/core";
import { Blocks } from "@/blocks";
import { bfsWithDependencies } from "@/utils/nodes";
import { NodeBlock } from "@/blocks/extensions/node";
import { AnyRegistrableBlock, BlockFieldNames, BlockInputNames, BlockLinesDefinition, ConnectionPointNames, StatementInputTypeNames } from "@/blocks/block_definitions";
import { AST, ASTNodeKind, ASTOperationNode, ASTPrimitiveNode, ASTSetNode, ASTSetNodeInput, createASTNode } from "./ast";
import types, { IType } from "@/data/types";
import { isTypedField } from "@/blocks/fields/field";

type BuildFn<B extends Blockly.Block, S extends ScopeASTBuilder<B>, R extends ASTSetNode | ASTOperationNode | ASTPrimitiveNode> = (scope: S) => R

export type NodeBuildFn<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends NodeBlock, R extends ASTSetNode> = BuildFn<B, NodeBlockASTBuilder<L, D, B>, R>
export type OperationBuildFn<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block, R extends ASTOperationNode | ASTPrimitiveNode> = BuildFn<B, BlockASTBuilder<L, D, B>, R>

export class ASTBuilder {
    ROOT_NODE = "root"

    public registerNode<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends NodeBlock, R extends ASTSetNode>(name: string, definition: D, builder: BuildFn<B, NodeBlockASTBuilder<L, D, B>, R>) {
        if (this.nodeSnippets[name]) {
            throw new Error(`Node ${name} already registered`)
        }

        console.log("Registering node", name)
        // TODO: Types are strange...
        this.nodeSnippets[name] = builder as unknown as BuildFn<B, NodeBlockASTBuilder<L, D, B>, R>
        this.definitions[name] = definition
    }

    public registerOperation<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block, R extends ASTOperationNode | ASTPrimitiveNode>(name: string, definition: D, builder: BuildFn<B, BlockASTBuilder<L, D, B>, R>) {
        if (this.operationSnippets[name]) {
            throw new Error(`Operation ${name} already registered`)
        }
        this.operationSnippets[name] = builder as unknown as BuildFn<B, BlockASTBuilder<L, D, B>, R>
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
                kind: ASTNodeKind.Set,
                attributes: {
                    id: root.id,
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
                kind: ASTNodeKind.Set,
                attributes: {
                    id: this.ROOT_NODE,
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
        R extends ASTSetNode
    >(block: B) {
        const builder = this.nodeSnippets[block.type] as NodeBuildFn<L, AnyRegistrableBlock<L>, B, R>
        return builder(new NodeBlockASTBuilder(this.definitions[block.type], block, this))
    }

    public buildASTForOperationBlock<
        L extends BlockLinesDefinition,
        B extends Blockly.Block,
        R extends ASTOperationNode | ASTPrimitiveNode
    >(block: B) {
        const builder = this.operationSnippets[block.type] as OperationBuildFn<L, AnyRegistrableBlock<L>, B, R>
        if (!builder) {
            throw new Error(`No builder found for block ${block.type}`)
        }
        return builder(new BlockASTBuilder(this.definitions[block.type], block, this))
    }

    private nodeSnippets: Record<string, BuildFn<any, NodeBlockASTBuilder<any[], any, any>, ASTSetNode>> = {}
    private operationSnippets: Record<string, BuildFn<any, BlockASTBuilder<any[], any, any>, ASTOperationNode | ASTPrimitiveNode>> = {}
    private definitions: Record<string, AnyRegistrableBlock<any>> = {}
}

interface ScopeASTBuilder<B extends Blockly.Block> {
    block: B
}

export class BlockASTBuilder<L extends BlockLinesDefinition, D extends AnyRegistrableBlock<L>, B extends Blockly.Block> implements ScopeASTBuilder<B> {
    constructor(public definition: D, public block: B, public builder: ASTBuilder) { }

    public buildASTForInput(name: BlockInputNames<L, D>): ASTOperationNode | ASTPrimitiveNode {
        const input = this.block.getInput(name);
        if (!input) {
            throw ReferenceError(`Input "${name}" doesn't exist on "${this.block.type}"`);
        }

        const targetBlock = input.connection?.targetBlock();

        if (!targetBlock) {
            return createASTNode(ASTNodeKind.Primitive, { value: this.block.getFieldValue(name), type: null })
        }

        return this.builder.buildASTForOperationBlock(targetBlock);
    }

    public buildASTForUnknownInput(name: BlockInputNames<L, D> | string): ASTOperationNode | ASTPrimitiveNode {
        return this.buildASTForInput(name as BlockInputNames<L, D>);
    }

    public buildASTForField(name: BlockFieldNames<L, D>, fn: (value: string) => ASTPrimitiveNode["value"] = (value) => value, overrideType: IType | string | undefined = undefined): ASTOperationNode | ASTPrimitiveNode {
        const field = this.block.getField(name);
        if (!field) {
            throw ReferenceError(`Field "${name}" doesn't exist on "${this.block.type}"`);
        }

        let type = isTypedField(field) ? field.getOutputType() : null
        
        if (overrideType) {
            type = types.utils.isType(overrideType) ? overrideType : types.utils.fromString(overrideType)
        }

        return createASTNode(ASTNodeKind.Primitive, { value: fn(this.block.getFieldValue(name)), type: type })
    }

    public buildASTForUnknownStatementInput(name: StatementInputTypeNames<L, D> | string): (ASTOperationNode | ASTPrimitiveNode)[] {
        return this.buildASTForStatementInput(name as StatementInputTypeNames<L, D>);
    }

    public buildASTForStatementInput(name: StatementInputTypeNames<L, D>): ASTOperationNode[] {
        let targetBlock = this.block.getInputTargetBlock(name);
        if (!targetBlock && !this.block.getInput(name)) {
            throw ReferenceError(`Input "${name}" doesn't exist on "${this.block.type}"`);
        }

        const segments: ASTOperationNode[] = []
        while (targetBlock) {
            const segment = this.builder.buildASTForOperationBlock(targetBlock);
            if ((segment as ASTPrimitiveNode).value) {
                throw new Error(`Unexpected primitive value in statement input ${name}`)
            }

            segments.push(segment as ASTOperationNode);
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

    public buildASTForConnectionPoint(inputName: ConnectionPointNames<L, D>): ASTSetNodeInput[] {
        const connection = this.block.edgeConnections.get(inputName);

        const connections = connection?.connections
            .map(conn => {
                const targetBlock = conn.getSourceBlock().id === this.block.id ? conn.targetBlock() : conn.getSourceBlock();

                if (!targetBlock || !Blocks.Types.isNodeBlock(targetBlock)) return [];

                return targetBlock.type === Blocks.Names.NODE.SUBSET
                    ? {
                        connectedSetId: targetBlock.id,
                        connectionPoint: targetBlock.edgeConnections.get("POSITIVE")?.connections.includes(conn.targetConnection!) ? "positive" : "negative"
                    }
                    : { connectedSetId: targetBlock.id, connectionPoint: null };
            })
            .filter(Boolean) as ASTSetNodeInput[];

        return connections || [];
    }
}