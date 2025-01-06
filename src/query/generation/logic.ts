import { Blocks } from "@/blocks"
import { Order, queryGenerator } from "../query_generator"
import * as Blockly from "blockly/core"

queryGenerator.registerBlock(Blocks.Names.LOGIC.BOOLEAN, (block) => {
    return [`${(block.getFieldValue("BOOL") as string).toLowerCase()}`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.LOGIC.OR, (block, generator) => {
    const statements = block.inputList.filter(input => input.type === Blockly.inputs.inputTypes.STATEMENT).map(input => generator.multilineStatementToCode(block, input.name, " && ").trim()).filter(statement => statement !== "")
    if (statements.length === 0) return "false"
    return `(${statements.join(" || ")})`
})

queryGenerator.registerBlock(Blocks.Names.LOGIC.NOT, (block, generator) => {
    const statement = generator.multilineStatementToCode(block, "STATEMENTS", " && ").trim()
    return `!(${statement === "" ? "true" : statement})`
})