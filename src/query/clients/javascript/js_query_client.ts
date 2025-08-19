import { createQueryClient } from "@/query/clients/query_client_build";
import { createOperationTransformer, createPrimitiveTransformer, createQueryFunctionTransformer, createSetArithmeticTransformer, createSubsetTransformer } from "@/query/clients/query_transformer";
import t, { IBooleanType } from "@/data/types"
import prettier from "prettier";
import babelParser from "prettier/plugins/babel"
import estree from "prettier/plugins/estree"
import { QueryCodeGenerator } from "@/query/clients/query_code_generator";
import { minify } from "terser";
import * as ambient from "@/query/clients/javascript/ambient/ambient_functions"
import * as datetime_ambient from "@/query/clients/javascript/ambient/datetime";
import { ASTSetNodeInput } from "@/query/builder/ast";
// import { JSSimpleRuntime } from "./js_simple_runtime";
// import { JSWorkerRuntime } from "./js_worker_runtime";
import { JSSecureRuntime } from "./js_secure_runtime";
import { NameManager } from "../query_name_manager";

export const jsQueryClient = createQueryClient({
    mode: "local",
    runtime: new JSSecureRuntime(),
    generator: new QueryCodeGenerator({
        transformers: [
            // Equals Operation
            createOperationTransformer({
                complexity: 1,
                operation: "equals",
                args: { a: t.nullable(t.union(t.number, t.string, t.boolean, t.enum(t.wildcard), t.hierarchy(t.wildcard))), b: t.nullable(t.union(t.number, t.string, t.boolean, t.enum(t.wildcard), t.hierarchy(t.wildcard))) },
                transformer: (astNode) => {
                    return `(${astNode.args.a} === ${astNode.args.b})`
                }
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "equals",
                args: { a: t.nullable(t.list(t.wildcard)), b: t.nullable(t.list(t.wildcard)) },
                transformer: (astNode) => `(${astNode.args.a}.length === ${astNode.args.b}.length && (${astNode.args.a}).every((v, i) => v === (${astNode.args.b})[i]))`
            }),
            createOperationTransformer({
                complexity: 2,
                operation: "equals",
                args: { a: t.nullable(t.struct(t.wildcard)), b: t.nullable(t.struct(t.wildcard)) },
                transformer: (astNode) => `Object.keys(${astNode.args.a}).length === Object.keys(${astNode.args.b}).length && Object.keys(${astNode.args.a}).every(key => (${astNode.args.b}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key]) && Object.keys(${astNode.args.b}).every(key => (${astNode.args.a}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key])`
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "equals",
                args: { a: t.nullable(t.timestamp), b: t.nullable(t.timestamp) },
                transformer: (astNode) => {
                    if (astNode.args.a === null || astNode.args.b === null) return `${astNode.args.a} === ${astNode.args.b}`
                    return `compareDates("equals", ${astNode.args.a}, ${astNode.args.b})`
                }
            }),

            // Matches Operation
            createOperationTransformer({
                complexity: 2,
                operation: "matches",
                args: { a: t.nullable(t.struct(t.wildcard)), b: t.nullable(t.struct(t.wildcard)) },
                transformer: (astNode) => `Object.keys(${astNode.args.a}).length >= Object.keys(${astNode.args.b}).length && Object.keys(${astNode.args.b}).every(key => (${astNode.args.a}).hasOwnProperty(key) && (${astNode.args.a})[key] === (${astNode.args.b})[key])`
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "matches",
                args: { a: t.nullable(t.hierarchy(t.wildcard)), b: t.nullable(t.hierarchy(t.wildcard)), hierarchy: t.string },
                transformer: (astNode) => `hierarchyEquals(${astNode.args.a}, ${astNode.args.b}, "${astNode.args.hierarchy}")`
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "matches",
                args: { a: t.nullable(t.wildcard), b: t.nullable(t.wildcard) },
                transformer: (astNode, utils) => utils.useAlias(astNode, "equals", utils.definition.args)
            }),

            // Equals Within Operation
            createOperationTransformer({
                complexity: 1,
                operation: "equals_within",
                args: { a: t.number, b: t.number, delta: t.number },
                transformer: (astNode) => `Math.abs(${astNode.args.a} - ${astNode.args.b}) <= ${astNode.args.delta}`
            }),
            createOperationTransformer({
                complexity: 2,
                operation: "equals_within",
                args: { a: t.timestamp, b: t.timestamp, delta: t.number },
                transformer: (astNode) => `(dateDiff(${astNode.args.a}, ${astNode.args.b}) <= ${astNode.args.delta}) && (dateDiff(${astNode.args.b}, ${astNode.args.a}) <= ${astNode.args.delta})`
            }),

            // Compare Numbers Operation
            createOperationTransformer({
                complexity: 1,
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
                complexity: 2,
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
                complexity: 1,
                operation: "compare_interval",
                args: { a: t.number, min: t.number, max: t.number },
                transformer: (astNode) => `(${astNode.args.a} > ${astNode.args.min} && ${astNode.args.a} < ${astNode.args.max})`
            }),
            createOperationTransformer({
                complexity: 2,
                operation: "compare_interval",
                args: { a: t.timestamp, min: t.timestamp, max: t.timestamp },
                transformer: (astNode) => `compareDates("after", ${astNode.args.a}, ${astNode.args.min}) && compareDates("before", ${astNode.args.a}, ${astNode.args.max})`
            }),

            // Is Null Operation
            createOperationTransformer({
                complexity: 1,
                operation: "is_null",
                args: { a: t.nullable(t.wildcard) },
                transformer: (astNode) => `(${astNode.args.a} === null)`
            }),

            createOperationTransformer({
                complexity: 1,
                operation: "get_struct_property",
                args: { struct: t.nullable(t.struct(t.wildcard)), property: t.nullable(t.wildcard) },
                transformer: (astNode) => `${astNode.args.struct}?.["${astNode.args.property}"]`
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "get_struct_property",
                args: { struct: t.nullable(t.list(t.struct(t.wildcard))), property: t.nullable(t.wildcard) },
                transformer: (astNode) => `(${astNode.args.struct}?.map(it => it["${astNode.args.property}"]).filter(it => it !== undefined) || [])`
            }),

            createOperationTransformer({
                complexity: 2,
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
                complexity: 1,
                operation: "list_length",
                args: { list: t.list(t.nullable(t.wildcard)) },
                transformer: (astNode) => `${astNode.args.list}.length`
            }),

            createOperationTransformer({
                complexity: 2,
                operation: "list_contains",
                args: { list: t.list(t.nullable(t.wildcard)), value: t.nullable(t.wildcard) },
                transformer: (astNode) => `(${astNode.args.list}).includes(${astNode.args.value})`
            }),

            createOperationTransformer({
                complexity: 2,
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
                complexity: 2,
                operation: "flatten_list",
                args: { list: t.list(t.list(t.wildcard)) },
                transformer: (astNode) => `[].concat(...${astNode.args.list})`
            }),

            createOperationTransformer({
                complexity: 2,
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

            createOperationTransformer<{ [key: `OR_STATEMENT_${number}`]: IBooleanType }>({
                complexity: 1,
                operation: "or",
                args: (astNode) => Object.values(astNode.args).reduce((acc, _, i) => ({ ...acc, [`OR_STATEMENT_${i}`]: t.boolean }), {}),
                transformer: (astNode) => `(${Object.values(astNode.args).join(" || ")})`
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "not",
                args: { STATEMENTS: t.boolean },
                transformer: (astNode) => `!(${astNode.args.STATEMENTS})`
            }),
            createOperationTransformer({
                complexity: 2,
                operation: "fib",
                args: { n: t.nullable(t.number) },
                transformer: (astNode) => {
                    if (astNode.args.n === null) return `0`
                    return `fib(${astNode.args.n})`
                }
            }),
            createOperationTransformer({
                complexity: 2,
                operation: "binary_math_operation",
                args: { a: t.nullable(t.number), b: t.nullable(t.number), operator: t.string },
                transformer: (astNode) => {
                    const op = astNode.args.operator.replaceAll("\"", "")

                    if (op === "DIVISION") {
                        return `(Math.round((${astNode.args.a} / ${astNode.args.b}) * 100000) / 100000)` // Round to 5 decimal places
                    }

                    if (op === "POWER") {
                        return `Math.pow(${astNode.args.a}, ${astNode.args.b})`
                    }

                    const operators = {
                        ADDITION: "+",
                        SUBTRACTION: "-",
                        MULTIPLICATION: "*",
                        MODULO: "%",
                    }

                    if (!(op in operators)) {
                        throw new Error(`Unknown operator: ${op}`)
                    }

                    return `(${astNode.args.a} ${operators[op as keyof typeof operators]} ${astNode.args.b})`
                }
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "number_property",
                args: { number: t.number, property: t.string },
                transformer: (astNode) => {
                    switch (astNode.args.property.replaceAll("\"", "")) {
                        case "EVEN": return `(${astNode.args.number} % 2 === 0)`
                        case "ODD": return `(${astNode.args.number} % 2 !== 0)`
                        case "POSITIVE": return `(${astNode.args.number} > 0)`
                        case "NEGATIVE": return `(${astNode.args.number} < 0)`
                        case "FRACTION": return `(${astNode.args.number} % 1 !== 0)`
                        case "WHOLE": return `(${astNode.args.number} % 1 === 0)`
                        default: return "false"
                    }
                }
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "number_property",
                args: { number: t.number, divisor: t.number, property: t.string },
                transformer: (astNode) => {
                    const op = astNode.args.property.replaceAll("\"", "")
                    if (op === "DIVISIBLE_BY") {
                        return `(${astNode.args.number} % ${astNode.args.divisor} === 0)`
                    }

                    return "false"
                }
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "unary_math_operation",
                args: { number: t.number, operator: t.string },
                transformer: (astNode) => {
                    const op = astNode.args.operator.replaceAll("\"", "")
                    switch (op) {
                        case "SIN": return `Math.sin(${astNode.args.number})`
                        case "COS": return `Math.cos(${astNode.args.number})`
                        case "TAN": return `Math.tan(${astNode.args.number})`
                        case "ASIN": return `Math.asin(${astNode.args.number})`
                        case "ACOS": return `Math.acos(${astNode.args.number})`
                        case "ATAN": return `Math.atan(${astNode.args.number})`
                        case "LOG": return `Math.log(${astNode.args.number})`
                        case "EXP": return `Math.exp(${astNode.args.number})`
                        case "ABS": return `Math.abs(${astNode.args.number})`
                        case "SQRT": return `Math.sqrt(${astNode.args.number})`
                        case "FLOOR": return `Math.floor(${astNode.args.number})`
                        case "CEIL": return `Math.ceil(${astNode.args.number})`
                        case "ROUND": return `Math.floor(${astNode.args.number} + 0.5)`
                        default: return astNode.args.number
                    }
                }
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "constant",
                args: { constant: t.string },
                transformer: (astNode) => {
                    const constant = astNode.args.constant.replaceAll("\"", "")
                    switch (constant) {
                        case "PI": return "Math.PI"
                        case "E": return "Math.E"
                        case "GOLDEN_RATIO": return "1.61803398875"
                        case "INFINITY": return "Infinity"
                        default: return "0"
                    }
                }
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "constrain",
                args: { a: t.number, low: t.number, high: t.number },
                transformer: (astNode) => `Math.min(Math.max(${astNode.args.a}, ${astNode.args.low}), ${astNode.args.high})`
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "constrain",
                args: { a: t.timestamp, low: t.timestamp, high: t.timestamp },
                transformer: (astNode) => `constrainDate(${astNode.args.a}, ${astNode.args.low}, ${astNode.args.high})`
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

            // Get Variable Operation
            createOperationTransformer({
                complexity: 1,
                operation: "get_variable",
                args: { name: t.string },
                transformer: (astNode) => `p["${astNode.args.name.replaceAll("\"", "")}"]`
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "get_local_variable",
                args: { name: t.string },
                transformer: (astNode) => `${astNode.args.name.replaceAll("\"", "")}`
            }),
            createOperationTransformer({
                complexity: 2,
                operation: "get_column",
                args: { name: t.string },
                transformer: (astNode) => `source.map(column => column["${astNode.args.name.replaceAll("\"", "")}"])`
            }),
            createOperationTransformer({
                complexity: 1,
                operation: "has_variable",
                args: { name: t.string },
                transformer: (astNode) => `p.hasOwnProperty("${astNode.args.name.replaceAll("\"", "")}") && p["${astNode.args.name.replaceAll("\"", "")}"] !== null && p["${astNode.args.name.replaceAll("\"", "")}"] !== undefined`
            }),

            createSubsetTransformer({
                transformer: (astNode, utils) => {
                    return `function ${utils.createName(astNode.attributes.id, `set_${astNode.attributes.name}`)}(source) {
                    return conditionalSplit(source, p => ${astNode.operations?.join(" && ") || "false"});
                }`
                }
            }),

            createSetArithmeticTransformer({
                transformer: (astNode, utils) => {
                    const selection = astNode.attributes.selection as string[]
                    return `function ${utils.createName(astNode.attributes.id, `set_arithmetic`)}(left, right, source) {
                    return setArithmetic(left, right, source, [${selection.map(it => `"${it}"`).join(", ")}]);
                }`
                }
            }),

            createQueryFunctionTransformer({
                transformer: (source, sets, targets, edgeSetMap, utils) => {
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
                            evaluatedInputs.push(`evaluated_${utils.getName(set.attributes.id)}${input.connectionPoint === "positive" || input.connectionPoint === "negative" ? `["${input.connectionPoint}"]` : ""}`)
                        }

                        if (evaluatedInputs.length === 1) return evaluatedInputs[0]
                        return `merge(${evaluatedInputs.join(", ")})`
                    }

                    return `function query_${source.attributes.name}(source) {
                        ${sets.map(set => {
                            const isArithmeticNode = set.attributes.selection !== undefined
                            let inputs: string | undefined = undefined
                            if (isArithmeticNode) {
                                inputs = processInputs(set.inputs?.["left"]) + ", " + processInputs(set.inputs?.["right"]) + ", source"
                            } else {
                                inputs = processInputs(set.inputs?.["input"])
                            }

                            return `const evaluated_${utils.getName(set.attributes.id)} = ${utils.getName(set.attributes.id)}(${inputs})` 
                        }).join("\n")}
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
        ambientFunctions: [...Object.values(ambient).map((fn) => fn.toString()), ...Object.values(datetime_ambient).map((fn) => fn.toString())],
        nameManager: new NameManager([
            ...Object.keys(ambient),
            ...Object.keys(datetime_ambient),
            "source",
            "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do",
            "else", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof",
            "new", "return", "super", "switch", "this", "throw", "try", "typeof", "var", "void",
            "while", "with", "yield",
            "enum",
            "implements", "interface", "let", "package", "private", "protected", "public", "static",
            "await",
            "null", "true", "false",
            // Magic variable
            "arguments",
            // Everything in the current environment (835 items in Chrome,
            // 104 in Node).
            ...Object.getOwnPropertyNames(globalThis),
        ])
    })
})