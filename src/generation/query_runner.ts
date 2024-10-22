import { DataRow, DataTable } from "@/data/table";
import { FunctionDeclaration, Parser, Program } from "acorn"
import * as ambient from "@/generation/ambient_functions"
import * as timeline_matcher from "@/generation/timeline_matcher"
import { typeRegistry } from "@/data/type_registry";

export type QueryFnReturnType<T> = {targets: Record<string, T>, edgeCounts: Record<string, number>}
export function runQuery(query: string, source: DataTable): QueryFnReturnType<DataTable> {
    if(source.getColumns().length === 0 || query === "" || !verifyCode(query)) return {targets: {}, edgeCounts: {}}
    const rows = source.getRows()

    if(!window.Blockly.typeRegistry) window.Blockly.typeRegistry = typeRegistry

    try {
        const queryFunction = new Function("init", `${query};return query(init);`)
        const result: QueryFnReturnType<DataRow[]> = queryFunction(rows)
        const tables: Record<string, DataTable> = {}
        for(const [id, rows] of Object.entries(result.targets)) {
            tables[id] = DataTable.fromRows(rows, source.getColumnTypes(), source.getColumnNames())
        }

        return {targets: tables, edgeCounts: result.edgeCounts}
    }catch(e){
        console.warn(e)
        return {targets: {}, edgeCounts: {}}
    }
}

function verifyCode(code: string): boolean {
    let program: Program | undefined = undefined
    try {
        program = Parser.parse(code, {ecmaVersion: 2020})
    } catch(e) {
        console.warn(e)
        return false
    }

    if(program === undefined || program.body.length === 0) return false

    const ambientFunctions = Object.keys(ambient).concat(Object.keys(timeline_matcher))

    for(const entry of program.body) {
        if(entry.type !== "FunctionDeclaration") {
            console.warn("On the highest level, only function declarations are allowed")
            return false
        }
    }

    for(const fn of ambientFunctions) {
        if(program.body.find(entry => entry.type === "FunctionDeclaration" && entry.id.name === fn) === undefined) {
            console.warn(`The ambient function ${fn} is not defined`)
            return false
        }
    }

    if(program.body.length > ambientFunctions.length + 1) {
        console.warn("Only one function besides the ambient functions is allowed")
        return false
    }

    const kernelFunction = program.body.find(entry => entry.type === "FunctionDeclaration" && !ambientFunctions.includes(entry.id.name)) as FunctionDeclaration | undefined

    if(kernelFunction === undefined) {
        console.warn("No query kernel function found")
        return false
    }

    const functionBody = kernelFunction.body.body
    if(functionBody[functionBody.length - 1]?.type !== "ReturnStatement") {
        // console.warn("The query kernel function must return a value")
        return false
    }

    return true
}