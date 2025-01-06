import { Blocks } from "@/blocks"
import { Order, queryGenerator } from "../query_generator"
import { ListSelectBlock } from "@/blocks/mutators/list_select"

queryGenerator.registerBlock(Blocks.Names.LIST.MATH, (block, generator) => {
    const list = generator.valueToCode(block, "LIST", Order.ATOMIC) || "[]"
    const operator = block.getFieldValue("OP")

    switch (operator) {
        case "SUM": return [`sum(${list})`, Order.ATOMIC]
        case "AVERAGE": return [`mean(${list})`, Order.ATOMIC]
        case "MIN": return [`Math.min(...${list})`, Order.ATOMIC]
        case "MAX": return [`Math.max(...${list})`, Order.ATOMIC]
        case "MEDIAN": return [`quantile(${list}, 0.5)`, Order.ATOMIC]
        case "STD": return [`std(${list})`, Order.ATOMIC]
        case "MODE": return [`mode(${list})`, Order.ATOMIC]
        case "VARIANCE": return [`variance(${list})`, Order.ATOMIC]
        case "RANGE": return [`Math.max(...${list}) - Math.min(...${list})`, Order.ATOMIC]
        case "IQR": return [`quantile(${list}, 0.75) - quantile(${list}, 0.25)`, Order.ATOMIC]
        case "Q1": return [`quantile(${list}, 0.25)`, Order.ATOMIC]
        case "Q3": return [`quantile(${list}, 0.75)`, Order.ATOMIC]
        case "COUNT": return [`${list}.length`, Order.ATOMIC]
        default: return [list, Order.ATOMIC]
    }
})

queryGenerator.registerBlock(Blocks.Names.LIST.LENGTH, (block, generator) => {
    const list = generator.valueToCode(block, "LIST", Order.ATOMIC) || "[]"
    return [`${list}.length`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.LIST.CONTAINS, (block, generator) => {
    const list = generator.valueToCode(block, "LIST", Order.ATOMIC) || "[]"
    const value = generator.valueToCode(block, "VALUE", Order.ATOMIC) || "null"
    return `(${list}).includes(${value})`
})

queryGenerator.registerBlock(Blocks.Names.LIST.ANY_ALL, (block, generator) => {
    const list = generator.valueToCode(block, "LIST", Order.ATOMIC) || "[]"
    const operator = block.getFieldValue("OP")
    const iteratorVariable = generator.getVariableName(block.getFieldValue("VALUE"))
    const query = generator.multilineStatementToCode(block, "QUERY", " && ") || "true"

    let code = ""
    switch (operator) {
        case "ANY":
            code = `(${list}).some(${iteratorVariable} => \n${query}\n)`
            break
        case "ALL":
            code = `(${list}).every(${iteratorVariable} => \n${query}\n)`
            break
    }

    return code
})

queryGenerator.registerBlock(Blocks.Names.LIST.IMMEDIATE, (block, generator) => {
    const values = (block as ListSelectBlock).getListElementInputs_().map(input => generator.valueToCode(block, input.name, Order.ATOMIC)).filter(value => value !== "")
    return [`[${values.join(", ")}]`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.LIST.FLATTEN, (block, generator) => {
    const list = generator.valueToCode(block, "LIST", Order.ATOMIC) || "[]"
    return [`[].concat(...${list})`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.LIST.EQUALS, (block, generator) => {
    const list1 = generator.valueToCode(block, "LIST1", Order.ATOMIC) || "[]"
    const list2 = generator.valueToCode(block, "LIST2", Order.ATOMIC) || "[]"
    const operator = block.getFieldValue("OP")

    let code = ""

    switch (operator) {
        case "EQUALS":
            // the two lists are exactly the same
            code = `(${list1}.length === ${list2}.length && (${list1}).every((v, i) => v === (${list2})[i]))`
            break
        case "CONTAINS":
            // list1 contains all the elements of list2 in the same order, but may have more elements
            code = `(${list1}).join(",").includes((${list2}).join(","))`
            break
        case "STARTS_WITH":
            // list1 starts with list2
            code = `(${list1}.length >= ${list2}.length && (${list1}).slice(0, (${list2}).length).join(",") === (${list2}).join(","))`
            break
        case "ENDS_WITH":
            // list1 ends with list2
            code = `(${list1}.length >= ${list2}.length && (${list1}).slice(-(${list2}).length).join(",") === (${list2}).join(","))`
            break
        case "CONTAINS_ALL_ITEMS_OF":
            // list1 contains all the elements of list2, but may have more elements
            code = `(${list2}).every(v => (${list1}).includes(v))`
            break
    }
    return code   
})