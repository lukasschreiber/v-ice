import { NodeBlock } from "@/blocks/extensions/node";
import * as Blockly from "blockly/core";
import { Order as JsOrder } from 'blockly/javascript';
import * as ambient from "@/query/ambient_functions"
import * as timeline_matcher from "@/query/timeline_matcher"
import { Blocks } from "@/blocks";
import { NodeConnectionType } from "@/blocks/fields/field_edge_connection";
import { FieldLabelTargetNode } from "@/blocks/fields/field_label_target_node";
import { Edge, getEdgeId } from "@/utils/edges";
import { bfsWithDependencies } from "@/utils/nodes";

export const Order = JsOrder

type GeneratorFn<B, T> = (block: B, generator: T) => [string, number] | string | null
type NodeGeneratorFn<B, T> = (block: B, generator: T) => null | { invocation: string | null, definition: string | null }

export class QueryGenerator extends Blockly.Generator {
    private queryFunctionDefinitions_: Record<string, string> = {}
    public PARAM_NAME = "dataset"

    constructor() {
        super("QueryCode")
    }

    override init(workspace: Blockly.Workspace) {
        super.init(workspace)


        // for name generation purposes we block all reserved words from the javascript generator as well as all ambient functions
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#Keywords
        this.addReservedWords(
            'break,case,catch,class,const,continue,debugger,default,delete,do,' +
            'else,export,extends,finally,for,function,if,import,in,instanceof,' +
            'new,return,super,switch,this,throw,try,typeof,var,void,' +
            'while,with,yield,' +
            'enum,' +
            'implements,interface,let,package,private,protected,public,static,' +
            'await,' +
            'null,true,false,' +
            // Magic variable.
            'arguments,' +
            // Everything in the current environment (835 items in Chrome,
            // 104 in Node).
            Object.getOwnPropertyNames(globalThis).join(','),
        );
        this.addReservedWords(this.PARAM_NAME)
        this.addReservedWords(Object.keys(ambient).join(","))
        this.addReservedWords(Object.keys(timeline_matcher).join(","))

        if (!this.nameDB_) {
            this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
        } else {
            this.nameDB_.reset();
        }

        this.nameDB_.setVariableMap(workspace.getVariableMap());
        this.nameDB_.populateVariables(workspace);
        this.nameDB_.populateProcedures(workspace);

        // we add all ambient functions to the definitions so they are available in the generated code
        Object.entries(ambient).forEach(([name, fn]) => {
            this.definitions_[name] = fn.toString()
        })

        // we add all timeline matcher functions to the definitions so they are available in the generated code
        Object.entries(timeline_matcher).forEach(([name, fn]) => {
            this.definitions_[name] = fn.toString()
        })
    }

    override finish(code: string): string {
        const definitions = Object.values(this.definitions_)
        super.finish(code)
        this.nameDB_!.reset();
        this.queryFunctionDefinitions_ = {}

        // we return the definitions of the ambient functions and the query function
        return definitions.join("\n\n") + `\n\n\nfunction query(${this.PARAM_NAME}){\n${this.prefixLines(code, this.INDENT)}\n}`;
    }

    override workspaceToCode(workspace?: Blockly.Workspace): string {
        if (!workspace) {
            // Backwards compatibility from before there could be multiple workspaces.
            console.warn(
                'No workspace specified in workspaceToCode call.  Guessing.',
            );
            workspace = Blockly.getMainWorkspace();
        }
        const functionInvocations: string[] = [];
        const targetObjectEntries: [string, string][] = [];
        const edges: Map<string, Edge> = new Map<string, Edge>();
        const edgeCountInvocations: [string, string][] = [];
        const functionDefinitions: string[] = [];
        const returnObjectEntries: Record<string, string> = {};

        this.init(workspace);

        const sourceNode = workspace.getTopBlocks(true).find(block => block.type === Blocks.Names.NODE.SOURCE) as NodeBlock | undefined
        if (sourceNode) {
            for (const node of bfsWithDependencies(sourceNode)) {
                if (node.type === Blocks.Names.NODE.SOURCE) continue

                const code = this.nodeBlockToCode(node)
                if (code.definition !== null) {
                    functionDefinitions.push(code.definition)
                }

                node.getEdges().forEach(edge => {
                    edges.set(getEdgeId(edge), edge)
                })

                if (code.invocation !== null) {
                    const functionEvaluatedName = this.getFunctionEvaluatedName(node.id)
                    if (node.type === Blocks.Names.NODE.TARGET) {
                        const targetLabel = (node.getField("LABEL") as FieldLabelTargetNode).getId()
                        targetObjectEntries.push([targetLabel!, functionEvaluatedName])
                    }
                    functionInvocations.push(`const ${functionEvaluatedName} = ${code.invocation};`)
                }
            }

            // we add the edges to the code
            for (const [id, edge] of edges) {
                const sourceId = edge.sourceField?.getConnectionType() === NodeConnectionType.INPUT ? edge.targetBlock?.id : edge.sourceBlock?.id
                const targetField = edge.sourceField?.getConnectionType() !== NodeConnectionType.INPUT ? edge.sourceField : edge.targetField
                if (!sourceId || !targetField) continue

                let set = this.getFunctionEvaluatedName(sourceId)
                if (targetField.getConnectionType() === NodeConnectionType.NEGATIVE) {
                    set += ".negative"
                } else if (targetField.getConnectionType() === NodeConnectionType.POSITIVE) {
                    set += ".positive"
                }

                edgeCountInvocations.push([id, `count(${set})`])
            }
        }

        returnObjectEntries["sets"] = `{\n${this.prefixLines(targetObjectEntries.map(([id, invocation]) => `"${id}": ${invocation}`).join(",\n"), this.INDENT)}\n}`

        const targetObject = `{\n${this.prefixLines(targetObjectEntries.map(([id, invocation]) => `"${id}": ${invocation}`).join(",\n"), this.INDENT)}\n}`
        const edgeCounts = `{\n${this.prefixLines(edgeCountInvocations.map(([id, invocation]) => `"${id}": ${invocation}`).join(",\n"), this.INDENT)}\n}`
        const returnObject = `{\n${this.prefixLines(`targets: ${targetObject},\nedgeCounts: ${edgeCounts}\n`, this.INDENT)}}`

        // Blank line between each section.
        let codeString = `${functionDefinitions.concat(functionInvocations).join('\n')}\nreturn ${returnObject}`;
        codeString = this.finish(codeString);
        // Final scrubbing of whitespace.
        codeString = codeString.replace(/^\s+\n/, '');
        codeString = codeString.replace(/\n\s+$/, '\n');
        codeString = codeString.replace(/[ \t]+\n/g, '\n');
        return codeString;
    }

    getFunctionEvaluatedName(id: string) {
        if (!this.getFunctionName(id)) {
            // if we don't have a function name we return the default parameter name and assume it's a source block
            return this.PARAM_NAME
        }
        return `${this.getFunctionName(id).toLowerCase()}_evaluated`
    }

    override scrub_(_block: Blockly.Block, code: string): string {
        if (code.trim().endsWith("&&")) {
            return code.replace(/\s+&&\s+/g, "")
        }
        return code
    }


    registerBlocks(names: string[], fn: GeneratorFn<Blockly.Block, this>) {
        for (const name of names) {
            this.registerBlock(name, fn)
        }
    }

    registerBlock(name: string, fn: GeneratorFn<Blockly.Block, this>) {
        this.forBlock[name] = (block, generator) => {
            return fn(block, generator)
        }
    }

    registerNodeBlock(name: string, fn: NodeGeneratorFn<NodeBlock, this>) {
        this.forNodeBlock[name] = (block, generator) => {
            const result = fn(block as NodeBlock, generator)
            if (result) {
                return result
            }
            return null
        }
    }

    getProcedureName(name: string) {
        return this.nameDB_!.getDistinctName(name, Blockly.Names.NameType.PROCEDURE)
    }

    registerFunctionName(blockId: string, name: string) {
        this.queryFunctionDefinitions_[blockId] = name
    }

    getFunctionName(blockId: string) {
        return this.queryFunctionDefinitions_[blockId]
    }

    multilineStatementToCode(block: Blockly.Block, name: string, infix?: string): string {
        let targetBlock = block.getInputTargetBlock(name);
        if (!targetBlock && !block.getInput(name)) {
            throw ReferenceError(`Input "${name}" doesn't exist on "${block.type}"`);
        }

        const lines: string[] = []
        while (targetBlock) {
            const line = this.blockToCode(targetBlock);
            // Value blocks must return code and order of operations info.
            // Statement blocks must only return code.
            if (typeof line !== 'string') {
                throw TypeError(
                    'Expecting code from statement block: ' +
                    (targetBlock && targetBlock.type),
                );
            }
            lines.push(line);
            targetBlock = targetBlock.getNextBlock();
        }

        let code = lines.filter(line => line.trim() !== "").join(infix || "\n")

        if (code) {
            code = this.prefixLines(code, this.INDENT);
        }
        return code;


    }

    suffixLines(text: string, suffix: string) {
        return text.split("\n").map(line => line + suffix).join("\n")
    }

    nodeBlockToCode(
        block: NodeBlock | null,
    ): { definition: string | null, invocation: string | null } {
        if (this.isInitialized === false) {
            console.warn(
                'CodeGenerator init was not called before blockToCode was called.',
            );
        }
        if (!block) {
            return { definition: "", invocation: "" };
        }

        const func = this.forNodeBlock[block.type];
        if (typeof func !== 'function') {
            throw Error(
                `${this.name_} generator does not know how to generate code ` +
                `for block type "${block.type}".`,
            );
        }

        const result = func.call(this, block, this);

        if (!result) return { definition: "", invocation: "" }

        if (typeof result.invocation === 'string') {
            if (this.STATEMENT_PREFIX && !block.suppressPrefixSuffix) {
                result.invocation = this.injectId(this.STATEMENT_PREFIX, block) + result.invocation;
            }
            if (this.STATEMENT_SUFFIX && !block.suppressPrefixSuffix) {
                result.invocation = result.invocation + this.injectId(this.STATEMENT_SUFFIX, block);
            }
            result.invocation = this.scrub_(block, result.invocation);
        }

        if (typeof result.definition === 'string') {
            result.definition = this.scrub_(block, result.definition);
        }

        return result;
    }

    forNodeBlock: Record<string, NodeGeneratorFn<NodeBlock, this>> = {}
}

export const queryGenerator = new QueryGenerator()