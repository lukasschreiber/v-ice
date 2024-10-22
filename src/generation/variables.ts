import { Blocks } from "@/blocks";
import { Order, queryGenerator } from "./query_generator";

queryGenerator.registerBlock(Blocks.Names.VARIABLE.GET, (block) => {
    const varModels = block.getVarModels()
    const variable = block.getVars().map(id => varModels.find(model => model.getId() === id))?.[0]
    const name = variable?.name || ""
    
    return [`p["${name}"]`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.VARIABLE.GET_COLUMN, (block) => {
    const column = block.getFieldValue("COLUMN")
    return [`init.map(column => column["${column}"])`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.VARIABLE.LOCAL_GET, (block) => {
    const name = block.getFieldValue("LABEL")
    return [`${name}`, Order.ATOMIC]
})
