import { Blocks } from "@/blocks"
import { Order, QueryGenerator, queryGenerator } from "./query_generator"
import * as Blockly from "blockly/core"

function binaryMathImpl(block: Blockly.Block, generator: QueryGenerator, impl: (a: string, b: string) => string, aName: string = "A", bName: string = "B"): [string, number] {
    const a = generator.valueToCode(block, aName, Order.ATOMIC) || "0"
    const b = generator.valueToCode(block, bName, Order.ATOMIC) || "0"
    return [impl(a, b), Order.ATOMIC]
}

queryGenerator.registerBlock(Blocks.Names.MATH.NUMBER, (block) => {
    return [`${block.getFieldValue("NUM")}`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.MATH.PLUS, (block, generator) => {
   return binaryMathImpl(block, generator, (a, b) => `(${a} + ${b})`)
})

queryGenerator.registerBlock(Blocks.Names.MATH.MINUS, (block, generator) => {
    if(block.getInputTargetBlock("A")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("B")?.type === Blocks.Names.TIMELINE.DATE_PICKER) {
        const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        return `dateDiff(${a}, ${b})`
    }

    return binaryMathImpl(block, generator, (a, b) => `(${a} - ${b})`)
})

queryGenerator.registerBlock(Blocks.Names.MATH.TIMES, (block, generator) => {
    return binaryMathImpl(block, generator, (a, b) => `(${a} * ${b})`)
})

queryGenerator.registerBlock(Blocks.Names.MATH.DIVIDED_BY, (block, generator) => {
    return binaryMathImpl(block, generator, (a, b) => `(Math.round((${a} / ${b}) * 100000) / 100000)`)
})

queryGenerator.registerBlock(Blocks.Names.MATH.BINARY, (block, generator) => {
    const operator = block.getFieldValue("OP")
    if (operator === "ADDITION") {
        return binaryMathImpl(block, generator, (a, b) => `(${a} + ${b})`)
    } else if (operator === "SUBTRACTION") {
        return binaryMathImpl(block, generator, (a, b) => `(${a} - ${b})`)
    } else if (operator === "MULTIPLICATION") {
        return binaryMathImpl(block, generator, (a, b) => `(${a} * ${b})`)
    } else if (operator === "DIVISION") {
        return binaryMathImpl(block, generator, (a, b) => `(Math.round((${a} / ${b}) * 100000) / 100000)`)
    } else if (operator === "POWER") {
        return binaryMathImpl(block, generator, (a, b) => `Math.pow(${a}, ${b})`)
    } else if (operator === "MODULO") {
        return binaryMathImpl(block, generator, (a, b) => `(${a} % ${b})`)
    }

    return ""
})

queryGenerator.registerBlock(Blocks.Names.MATH.UNARY, (block, generator) => {
    const value = generator.valueToCode(block, "NUM", Order.ATOMIC) || "0"
    const operator = block.getFieldValue("OP")

    switch (operator) {
        case "SIN": return [`Math.sin(${value})`, Order.ATOMIC]
        case "COS": return [`Math.cos(${value})`, Order.ATOMIC]
        case "TAN": return [`Math.tan(${value})`, Order.ATOMIC]
        case "ASIN": return [`Math.asin(${value})`, Order.ATOMIC]
        case "ACOS": return [`Math.acos(${value})`, Order.ATOMIC]
        case "ATAN": return [`Math.atan(${value})`, Order.ATOMIC]
        case "LOG": return [`Math.log(${value})`, Order.ATOMIC]
        case "EXP": return [`Math.exp(${value})`, Order.ATOMIC]
        case "ABS": return [`Math.abs(${value})`, Order.ATOMIC]
        case "SQRT": return [`Math.sqrt(${value})`, Order.ATOMIC]
        case "FLOOR": return [`Math.floor(${value})`, Order.ATOMIC]
        case "CEIL": return [`Math.ceil(${value})`, Order.ATOMIC]
        case "ROUND": return [`Math.floor(${value} + 0.5)`, Order.ATOMIC]
        default: return [value, Order.ATOMIC]
    }
})

queryGenerator.registerBlock(Blocks.Names.MATH.CONSTANTS, (block) => {
    const constant = block.getFieldValue("CONSTANT")
    switch (constant) {
        case "PI": return ["Math.PI", Order.ATOMIC]
        case "E": return ["Math.E", Order.ATOMIC]
        case "GOLDEN_RATIO": return ["1.61803398875", Order.ATOMIC]
        case "INFINITY": return ["Infinity", Order.ATOMIC]
        default: return ["0", Order.ATOMIC]
    }
})

queryGenerator.registerBlock(Blocks.Names.MATH.CONSTRAIN, (block, generator) => {
    const value = generator.valueToCode(block, "NUM", Order.ATOMIC) || "0"
    const min = generator.valueToCode(block, "LOW", Order.ATOMIC) || "0"
    const max = generator.valueToCode(block, "HIGH", Order.ATOMIC) || "0"

    if(block.getInputTargetBlock("A")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("B")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("C")?.type === Blocks.Names.TIMELINE.DATE_PICKER) {
        const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        const c = generator.valueToCode(block, "C", Order.ATOMIC) || "0"
        return `constrainDate(${a}, ${b}, ${c})`
    }

    return [`Math.min(Math.max(${value}, ${min}), ${max})`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.MATH.NUMBER_PROPERTY, (block, generator) => {
    const value = generator.valueToCode(block, "NUM", Order.ATOMIC) || "0"
    const property = block.getFieldValue("PROPERTY")
    switch (property) {
        case "EVEN": return `(${value} % 2 === 0)`
        case "ODD": return `(${value} % 2 === 1)`
        case "PRIME": return `isPrime(${value})`
        case "POSITIVE": return `(${value} > 0)`
        case "NEGATIVE": return `(${value} < 0)`
        case "FRACTION": return `(${value} % 1 !== 0)`
        case "WHOLE": return `(${value} % 1 === 0)`
        case "DIVISIBLE_BY": {
            const divisor = generator.valueToCode(block, "DIVISOR", Order.ATOMIC) || "0"
            return `(${value} % ${divisor} === 0)`
        }
        default: return "false"
    }
})