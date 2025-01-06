import { Blocks } from "@/blocks"
import { Order, queryGenerator } from "../query_generator"
import types from "@/data/types"

queryGenerator.registerBlock(Blocks.Names.ENUM.SELECT, (block) => {
    return [`"${block.getFieldValue("ENUM")}"`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.HIERARCHY.SELECT, (block) => {
    return [`"${block.getFieldValue("HIERARCHY")}"`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.STRUCTS.IMMEDIATE, (block, generator) => {
    const properties = block.inputList.filter((input) => input.name.startsWith("PROPERTY")).map(input => {
        const labelName = `LABEL_${input.name}`
        const label = block.getFieldValue(labelName)
        return `${label}: ${generator.valueToCode(block, input.name, Order.ATOMIC)}`
    })
    return [`{${properties.join(", ")}}`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.STRUCTS.GET_PROPERTY, (block, generator) => {
    const struct = generator.valueToCode(block, "STRUCT", Order.ATOMIC) || "{}"
    const property = block.getFieldValue("PROPERTY")

    const structType = block.getInput("STRUCT")?.connection?.targetBlock()?.outputConnection?.getCheck()?.[0]
    if (structType) {
        const type = types.utils.fromString(structType)
        if (types.utils.isList(type)) {
            return [`((${struct})?.map(it => it["${property}"]).filter(it => it !== undefined) || [])`, Order.ATOMIC]
        }
    }

    return [`${struct}?.["${property}"]`, Order.ATOMIC]
})