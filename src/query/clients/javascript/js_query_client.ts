import { createQueryClient } from "../query_client_build";
import { createOperationTransformer, createPrimitiveTransformer, createQueryFunctionTransformer, createSubsetTransformer } from "../query_transformer";
import t from "@/data/types"
import prettier from "prettier";
import babelParser from "prettier/plugins/babel"
import estree from "prettier/plugins/estree"
import { QueryCodeGenerator } from "../query_code_generator";
import { minify } from "terser";
import * as ambient from "@/query/ambient_functions"
import { ASTSetNodeInput } from "@/query/builder/ast";
import { DataRow, DataTable } from "@/data/table";
import { QueryFnReturnType } from "../local_query_runtime";
import { typeRegistry } from "@/data/type_registry";

export const jsQueryClient = createQueryClient({
    mode: "local",
    runtime: {
        execute(query: string, source: DataTable): Promise<QueryFnReturnType<DataTable>> {
            return new Promise((resolve) => {
                if (source.getColumnCount() === 0 || source.getRowCount() === 0 || query === "") {
                    resolve({ targets: {}, edgeCounts: {} });
                    return;
                }
                if (!window.Blockly.typeRegistry) window.Blockly.typeRegistry = typeRegistry
                const rows = source.getRows()
                
                try {
                    // we assume that only one source with the name root is present
                    const queryFunction = new Function("init", `${query};return query_root(init);`)
                    const result: QueryFnReturnType<DataRow[]> = queryFunction(rows)
                    const tables: Record<string, DataTable> = {}
                    for (const [id, rows] of Object.entries(result.targets)) {
                        tables[id] = DataTable.fromRows(rows, source.getColumnTypes(), source.getColumnNames())
                    }

                    resolve({ targets: tables, edgeCounts: {} })
                    // resolve({ targets: tables, edgeCounts: result.edgeCounts })
                    return;
                } catch (e) {
                    console.warn(e)
                    resolve({ targets: {}, edgeCounts: {} });
                    return;
                }
            })
        }
    },
    generator: new QueryCodeGenerator({
        transformers: [
            // Equals Operation
            createOperationTransformer({
                operation: "equals",
                args: { a: t.union(t.number, t.string, t.boolean), b: t.union(t.number, t.string, t.boolean) },
                transformer: (astNode) => `(${astNode.args.a} === ${astNode.args.b})`
            }),
            createOperationTransformer({
                operation: "equals",
                args: { a: t.list(t.wildcard), b: t.list(t.wildcard) },
                transformer: (astNode) => `(${astNode.args.a}.length === ${astNode.args.b}.length && (${astNode.args.a}).every((v, i) => v === (${astNode.args.b})[i]))`
            }),
            createOperationTransformer({
                operation: "equals",
                args: { a: t.struct(t.wildcard), b: t.struct(t.wildcard) },
                transformer: (astNode) => `Object.keys(${astNode.args.a}).length === Object.keys(${astNode.args.b}).length && Object.keys(${astNode.args.a}).every(key => (${astNode.args.b}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key]) && Object.keys(${astNode.args.b}).every(key => (${astNode.args.a}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key])`
            }),
            createOperationTransformer({
                operation: "equals",
                args: { a: t.timestamp, b: t.timestamp },
                transformer: (astNode) => `compareDates("equals", ${astNode.args.a}, ${astNode.args.b})`
            }),

            // Matches Operation
            createOperationTransformer({
                operation: "matches",
                args: { a: t.struct(t.wildcard), b: t.struct(t.wildcard) },
                transformer: (astNode) => `Object.keys(${astNode.args.a}).length >= Object.keys(${astNode.args.b}).length && Object.keys(${astNode.args.b}).every(key => (${astNode.args.a}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key])`
            }),
            createOperationTransformer({
                operation: "matches",
                args: { a: t.hierarchy(t.wildcard), b: t.hierarchy(t.wildcard) },
                transformer: (astNode) => `hierarchyEquals(${astNode.args.a}, ${astNode.args.b}, "${astNode.args.hierarchy}")`
            }),
            createOperationTransformer({
                operation: "matches",
                args: { a: t.wildcard, b: t.wildcard },
                // TODO allow the use of different operation handlers e.g. the handler for equals
                transformer: (astNode) => `(${astNode.args.a} === ${astNode.args.b})`
            }),

            createOperationTransformer({
                operation: "fib",
                args: { n: t.number },
                transformer: (astNode) => {
                    return `fib(${astNode.args.n})`
                }
            }),

            // Equals Within Operation
            createOperationTransformer({
                operation: "equals_within",
                args: { a: t.number, b: t.number, delta: t.number },
                transformer: (astNode) => `Math.abs(${astNode.args.a} - ${astNode.args.b}) <= ${astNode.args.delta}`
            }),
            createOperationTransformer({
                operation: "equals_within",
                args: { a: t.timestamp, b: t.timestamp, delta: t.number },
                transformer: (astNode) => `(dateDiff(${astNode.args.a}, ${astNode.args.b}) <= ${astNode.args.delta}) && (dateDiff(${astNode.args.b}, ${astNode.args.a}) <= ${astNode.args.delta})`
            }),

            // Compare Numbers Operation
            createOperationTransformer({
                operation: "compare_numbers",
                args: { a: t.number, b: t.number, operator: t.string },
                transformer: (astNode) => {
                    const operators = {
                        GREATER: ">",
                        LESS: "<",
                        LEQ: "<=",
                        GEQ: ">="
                    }

                    if (!(astNode.args.operator.replaceAll("\"", "") in operators)) {
                        throw new Error(`Unknown operator: ${astNode.args.operator.replaceAll("\"", "") }`)
                    }

                    return `(${astNode.args.a} ${operators[astNode.args.operator.replaceAll("\"", "") as keyof typeof operators]} ${astNode.args.b})`
                }
            }),
            createOperationTransformer({
                operation: "compare_numbers",
                args: { a: t.timestamp, b: t.timestamp, operator: t.string },
                transformer: (astNode) => {
                    const operators = {
                        GREATER: "after",
                        LESS: "before",
                        LEQ: "before_or_equals",
                        GEQ: "after_or_equals"
                    }

                    if (!(astNode.args.operator.replaceAll("\"", "") in operators)) {
                        throw new Error(`Unknown operator: ${astNode.args.operator.replaceAll("\"", "") }`)
                    }

                    return `compareDates("${operators[astNode.args.operator.replaceAll("\"", "") as keyof typeof operators]}", ${astNode.args.a}, ${astNode.args.b})`
                }
            }),

            // Compare Interval Operation
            createOperationTransformer({
                operation: "compare_interval",
                args: { a: t.number, min: t.number, max: t.number },
                transformer: (astNode) => `(${astNode.args.a} > ${astNode.args.min} && ${astNode.args.a} < ${astNode.args.max})`
            }),
            createOperationTransformer({
                operation: "compare_interval",
                args: { a: t.timestamp, min: t.timestamp, max: t.timestamp },
                transformer: (astNode) => `compareDates("after", ${astNode.args.a}, ${astNode.args.min}) && compareDates("before", ${astNode.args.a}, ${astNode.args.max})`
            }),

            // Is Null Operation
            createOperationTransformer({
                operation: "is_null",
                args: { a: t.nullable(t.wildcard) },
                transformer: (astNode) => `(${astNode.args.a} === null)`
            }),

            // Primitive Transformers
            createPrimitiveTransformer({
                type: t.nullable(t.union(t.number, t.boolean, t.timestamp)),
                transformer: (astNode) => `${astNode.value}`
            }),
            createPrimitiveTransformer({
                type: t.nullable(t.union(t.string, t.enum(t.wildcard), t.hierarchy(t.wildcard))),
                transformer: (astNode) => `"${astNode.value}"`
            }),
            createPrimitiveTransformer({
                type: t.nullable(t.list(t.wildcard)),
                transformer: (astNode) => `${astNode.value === null ? "null" : `[${astNode.value.map(v => v.toString()).join(", ")}]`}`
            }),
            createPrimitiveTransformer({
                type: t.nullable(t.struct(t.wildcard)),
                transformer: (astNode) => `${astNode.value === null ? "null" : JSON.stringify(astNode.value)}`
            }),

            createOperationTransformer({
                operation: "get_variable",
                args: { name: t.string },
                transformer: (astNode) => `p["${astNode.args.name.replaceAll("\"", "")}"]`
            }),

            createSubsetTransformer({
                transformer: (astNode) => {
                    return `function set_${astNode.attributes.name}(source) {
                    return conditionalSplit(source, p => ${astNode.operations?.join(" && ") || "false"});
                }`
                }
            }),

            createQueryFunctionTransformer({
                transformer: (source, sets, targets) => {
                    function processInputs(inputs: ASTSetNodeInput[] | undefined): string {
                        if (inputs === undefined || inputs?.length === 0) return ""

                        const evaluatedInputs = []
                        for (const input of inputs) {
                            if (input.connectedSetId === source.attributes.id) {
                                evaluatedInputs.push("source")
                                continue
                            }

                            const set = sets.find(set => set.attributes.id === input.connectedSetId)
                            if (set === undefined) throw new Error(`Set with id ${input.connectedSetId} not found`)
                            evaluatedInputs.push(`evaluated_set_${set.attributes.name}${input.connectionPoint === "positive" || input.connectionPoint === "negative" ? `["${input.connectionPoint}"]` : ""}`)
                        }

                        if (evaluatedInputs.length === 1) return evaluatedInputs[0]
                        return `merge(${evaluatedInputs.join(", ")})`
                    }

                    return `function query_${source.attributes.name}(source) {
                        ${sets.map(set => `const evaluated_set_${set.attributes.name} = set_${set.attributes.name}(${processInputs(set.inputs?.["input"])})`).join("\n")}
                        return {
                            targets: {${targets.map(target => `"${target.attributes.id}": ${processInputs(target.inputs?.["input"])}`).join(", ")}}
                        }
                    }`
                }
            }),

        ],
        formatCode: (code) => prettier.format(code, { parser: "babel", plugins: [babelParser, estree], tabWidth: 4 }),
        optimizeCode: async (code) => {
            const result = await minify(code, {
                compress: {
                    booleans_as_integers: false,
                    booleans: false,
                    comparisons: true,
                    evaluate: true,
                    keep_fargs: false,
                    keep_infinity: true,
                    unsafe: false,
                    conditionals: false,
                    sequences: false,
                    unused: true,
                    toplevel: true,
                    inline: false,
                    join_vars: false,
                    reduce_vars: false,
                    reduce_funcs: false,
                    top_retain: /^query_/,
                },
                mangle: false,
                output: {
                    braces: true,
                    beautify: true,
                    comments: false,
                }
            });
            if (result.code === undefined) {
                throw new Error(`Error while optimizing code`);
            }
            return result.code;
        },
        ambientFunctions: Object.values(ambient).map((fn) => fn.toString())
    })
})