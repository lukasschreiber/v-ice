import { createQueryClient } from "@/query/clients/query_client_build";
import { createOperationTransformer, createPrimitiveTransformer, createQueryFunctionTransformer, createSubsetTransformer } from "@/query/clients/query_transformer";
import t from "@/data/types"
import prettier from "prettier";
import babelParser from "prettier/plugins/babel"
import estree from "prettier/plugins/estree"
import { QueryCodeGenerator } from "@/query/clients/query_code_generator";
import { minify } from "terser";
import * as ambient from "@/query/ambient_functions"
import { ASTSetNodeInput } from "@/query/builder/ast";
import { JSHardenedRuntime } from "@/query/clients/javascript/js_hardened_runtime";

export const jsQueryClient = createQueryClient({
    mode: "local",
    runtime: new JSHardenedRuntime(),
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
                        throw new Error(`Unknown operator: ${astNode.args.operator.replaceAll("\"", "")}`)
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
                        throw new Error(`Unknown operator: ${astNode.args.operator.replaceAll("\"", "")}`)
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

            createOperationTransformer({
                operation: "get_struct_property",
                args: { struct: t.nullable(t.struct(t.wildcard)), property: t.nullable(t.string) },
                transformer: (astNode) => `${astNode.args.struct}?.["${astNode.args.property}"]`
            }),
            createOperationTransformer({
                operation: "get_struct_property",
                args: { struct: t.nullable(t.list(t.struct(t.wildcard))), property: t.nullable(t.string) },
                transformer: (astNode) => `(${astNode.args.struct}?.map(it => it["${astNode.args.property}"]).filter(it => it !== undefined) || [])`
            }),

            createOperationTransformer({
                operation: "unary_list_operation",
                args: { operator: t.string, list: t.list(t.number) },
                transformer: (astNode) => {
                    switch (astNode.args.operator.replaceAll("\"", "")) {
                        case "SUM": return `sum(${astNode.args.list})`
                        case "AVERAGE": return `mean(${astNode.args.list})`
                        case "MIN": return `Math.min(...${astNode.args.list})`
                        case "MAX": return `Math.max(...${astNode.args.list})`
                        case "MEDIAN": return `quantile(${astNode.args.list}, 0.5)`
                        case "STD": return `std(${astNode.args.list})`
                        case "MODE": return `mode(${astNode.args.list})`
                        case "VARIANCE": return `variance(${astNode.args.list})`
                        case "RANGE": return `Math.max(...${astNode.args.list}) - Math.min(...${astNode.args.list})`
                        case "IQR": return `quantile(${astNode.args.list}, 0.75) - quantile(${astNode.args.list}, 0.25)`
                        case "Q1": return `quantile(${astNode.args.list}, 0.25)`
                        case "Q3": return `quantile(${astNode.args.list}, 0.75)`
                        case "COUNT": return `${astNode.args.list}.length`
                        default: return astNode.args.list
                    }
                }
            }),

            createOperationTransformer({
                operation: "list_length",
                args: { list: t.list(t.nullable(t.wildcard)) },
                transformer: (astNode) => `${astNode.args.list}.length`
            }),

            createOperationTransformer({
                operation: "list_contains",
                args: { list: t.list(t.nullable(t.wildcard)), value: t.nullable(t.wildcard) },
                transformer: (astNode) => `(${astNode.args.list}).includes(${astNode.args.value})`
            }),

            createOperationTransformer({
                operation: "list_any_all",
                args: { list: t.list(t.nullable(t.wildcard)), value: t.string, operation: t.string, query: t.string },
                transformer: (astNode) => {
                    const operators = {
                        ANY: "some",
                        ALL: "every"
                    }

                    if (!(astNode.args.operation.replaceAll("\"", "") in operators)) {
                        throw new Error(`Unknown operator: ${astNode.args.operation.replaceAll("\"", "")}`)
                    }

                    return `(${astNode.args.list}).${operators[astNode.args.operation.replaceAll("\"", "") as keyof typeof operators]}(${astNode.args.value} => ${astNode.args.query})`
                }
            }),

            createOperationTransformer({
                operation: "flatten_list",
                args: { list: t.list(t.list(t.wildcard)) },
                transformer: (astNode) => `[].concat(...${astNode.args.list})`
            }),

            createOperationTransformer({
                operation: "list_equals",
                args: { a: t.list(t.wildcard), b: t.list(t.wildcard), operator: t.string },
                transformer: (astNode) => {
                    const operator = astNode.args.operator.replaceAll("\"", "")
                    const a = astNode.args.a
                    const b = astNode.args.b

                    switch (operator) {
                        case "EQUALS": return `(${a}.length === ${b}.length && (${a}).every((v, i) => v === (${b})[i]))`
                        case "CONTAINS": return `(${a}).join(",").includes((${b}).join(","))`
                        case "STARTS_WITH": return `(${a}.length >= ${b}.length && (${a}).slice(0, (${b}).length).join(",") === (${b}).join(","))`
                        case "ENDS_WITH": return `(${a}.length >= ${b}.length && (${a}).slice(-(${b}).length).join(",") === (${b}).join(","))`
                        case "CONTAINS_ALL_ITEMS_OF": return `(${b}).every(v => (${a}).includes(v))`
                        default: throw new Error(`Unknown operator: ${operator}`)
                    }
                }
            }),

            // Primitive Transformers
            createPrimitiveTransformer({
                type: t.nullable(t.union(t.number, t.boolean, t.timestamp)),
                transformer: (astNode) => `${astNode.value}`
            }),
            createPrimitiveTransformer({
                type: t.nullable(t.union(t.string, t.enum(t.wildcard), t.hierarchy(t.wildcard))),
                transformer: (astNode) => `"${astNode.value?.replaceAll("\"", "\\\"")}"`
            }),
            createPrimitiveTransformer({
                type: t.nullable(t.list(t.wildcard)),
                transformer: (astNode) => `${astNode.value === null ? "null" : `[${astNode.value.map(v => v.toString()).join(", ")}]`}`
            }),
            createPrimitiveTransformer({
                type: t.nullable(t.struct(t.wildcard)),
                transformer: (astNode) => `${astNode.value === null ? "null" : JSON.stringify(astNode.value)}`
            }),
            createPrimitiveTransformer({
                type: t.null,
                transformer: () => `null`
            }),
            // TODO: check that always the strictest type is used

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
                transformer: (source, sets, targets, edgeSetMap) => {
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
                            targets: {${targets.map(target => `"${target.attributes.targetId}": ${processInputs(target.inputs?.["input"])}`).join(", ")}},
                            edgeCounts: {${Array.from(edgeSetMap.entries()).map(([key, value]) => `"${key}": count(${processInputs([{
                        connectedSetId: value.sourceBlock.attributes.id,
                        connectionPoint: value.sourceField
                    }])})`).join(", ")}}
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