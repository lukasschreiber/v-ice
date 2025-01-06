import { Blocks } from "@/blocks"
import { Order, QueryGenerator, queryGenerator } from "../query_generator"
import * as Blockly from "blockly/core"
import types from "@/data/types"

function binaryComparisonImpl(block: Blockly.Block, generator: QueryGenerator, impl: (a: string, b: string) => string, aName: string = "A", bName: string = "B"): string {
    const a = generator.valueToCode(block, aName, Order.ATOMIC) || "0"
    const b = generator.valueToCode(block, bName, Order.ATOMIC) || "0"
    return impl(a, b)
}

queryGenerator.registerBlock(Blocks.Names.COMPARISON.EQUALS, (block, generator) => {
    // handle array comparisons, we need to check if both array contain the same elements in the same order
    if (block.getInputTargetBlock("A")?.type === Blocks.Names.LIST.IMMEDIATE || block.getInputTargetBlock("B")?.type === Blocks.Names.LIST.IMMEDIATE) {
        const list1 = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const list2 = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        return `(${list1}.length === ${list2}.length && (${list1}).every((v, i) => v === (${list2})[i]))`
    }

    // handle struct comparisons, we need to check if both structs contain the same fields with the same values
    if (block.getInputTargetBlock("A")?.type === Blocks.Names.STRUCTS.IMMEDIATE || block.getInputTargetBlock("B")?.type === Blocks.Names.STRUCTS.IMMEDIATE) {
        const struct1 = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const struct2 = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        return `Object.keys(${struct1}).length === Object.keys(${struct2}).length && Object.keys(${struct1}).every(key => (${struct2}).hasOwnProperty(key) && (${struct1})[key] === (${struct2})[key]) && Object.keys(${struct2}).every(key => (${struct1}).hasOwnProperty(key) && (${struct1})[key] === (${struct2})[key])`
    }

    if(block.getInputTargetBlock("A")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("B")?.type === Blocks.Names.TIMELINE.DATE_PICKER) {
        const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        return `compareDates("equals", ${a}, ${b})`
    }

    return binaryComparisonImpl(block, generator, (a, b) => `(${a} === ${b})`)
})

queryGenerator.registerBlock(Blocks.Names.COMPARISON.MATCHES, (block, generator) => {
    // handle struct comparisons, we need to check if both structs contain the same fields with the same values
    if (block.getInputTargetBlock("A")?.type === Blocks.Names.STRUCTS.IMMEDIATE || block.getInputTargetBlock("B")?.type === Blocks.Names.STRUCTS.IMMEDIATE) {
        const struct1 = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const struct2 = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        return `Object.keys(${struct1}).length >= Object.keys(${struct2}).length && Object.keys(${struct2}).every(key => (${struct1}).hasOwnProperty(key) && (${struct1})[key] === (${struct2})[key])`
    }

    // if we are comparing two hierarchy values we need to check if the second value is a subtype of the first
    if (block.getInputTargetBlock("A")?.type === Blocks.Names.HIERARCHY.SELECT || block.getInputTargetBlock("B")?.type === Blocks.Names.HIERARCHY.SELECT) {
        const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        const hierarchyTypeString = block.getInput("A")?.connection?.getCheck()?.[0]
        if (hierarchyTypeString) {
            const hierarchyType = types.utils.fromString(hierarchyTypeString)
            if (types.utils.isHierarchy(hierarchyType)) {
                return `hierarchyEquals(${a}, ${b}, "${hierarchyType.hierarchy}")`
            }
        }
        return `false`
    }

    // in all other cases, we can just use the equality comparison
    return queryGenerator.forBlock[Blocks.Names.COMPARISON.EQUALS](block, generator)
})

queryGenerator.registerBlock(Blocks.Names.COMPARISON.EQUALS_WITHIN, (block, generator) => {
    const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
    const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
    const delta = generator.valueToCode(block, "DELTA", Order.ATOMIC) || "0"

    if(block.getInputTargetBlock("A")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("B")?.type === Blocks.Names.TIMELINE.DATE_PICKER) {
        const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        return `(dateDiff(${a}, ${b}) <= ${delta}) && (dateDiff(${b}, ${a}) <= ${delta})`
    }

    return `((${a} - ${b}) <= ${delta}) && ((${b} - ${a}) <= ${delta})`
})

queryGenerator.registerBlock(Blocks.Names.COMPARISON.GREATER, (block, generator) => {
    if(block.getInputTargetBlock("A")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("B")?.type === Blocks.Names.TIMELINE.DATE_PICKER) {
        const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        return `compareDates("after", ${a}, ${b})`
    }

    return binaryComparisonImpl(block, generator, (a, b) => `(${a} > ${b})`)
})

queryGenerator.registerBlock(Blocks.Names.COMPARISON.LESS, (block, generator) => {
    if(block.getInputTargetBlock("A")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("B")?.type === Blocks.Names.TIMELINE.DATE_PICKER) {
        const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        return `compareDates("before", ${a}, ${b})`
    }

    return binaryComparisonImpl(block, generator, (a, b) => `(${a} < ${b})`)
})

queryGenerator.registerBlock(Blocks.Names.COMPARISON.LESS_EQUALS, (block, generator) => {
    if(block.getInputTargetBlock("A")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("B")?.type === Blocks.Names.TIMELINE.DATE_PICKER) {
        const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        return `compareDates("before_or_equals", ${a}, ${b})`
    }

    return binaryComparisonImpl(block, generator, (a, b) => `(${a} <= ${b})`)
})

queryGenerator.registerBlock(Blocks.Names.COMPARISON.GREATER_EQUALS, (block, generator) => {
    if(block.getInputTargetBlock("A")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("B")?.type === Blocks.Names.TIMELINE.DATE_PICKER) {
        const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        return `compareDates("after_or_equals", ${a}, ${b})`
    }

    return binaryComparisonImpl(block, generator, (a, b) => `(${a} >= ${b})`)
})

queryGenerator.registerBlock(Blocks.Names.COMPARISON.NUMBERS, (block, generator) => {
    const operator = block.getFieldValue("OP")
    const opCode = operator === "LESS" ? "<" : operator === "GREATER" ? ">" : operator === "LEQ" ? "<=" : operator === "GEQ" ? ">=" : "==="

    if(block.getInputTargetBlock("A")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("B")?.type === Blocks.Names.TIMELINE.DATE_PICKER) {
        const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
        const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
        const op = operator === "LESS" ? "before" : operator === "GREATER" ? "after" : operator === "LEQ" ? "before_or_equals" : operator === "GEQ" ? "after_or_equals" : "equals"
        return `compareDates("${op}", ${a}, ${b})`
    }

    return binaryComparisonImpl(block, generator, (a, b) => `(${a} ${opCode} ${b})`)
})

queryGenerator.registerBlock(Blocks.Names.COMPARISON.NULL, (block, generator) => {
    const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
    return `(${a} === null)`
})

queryGenerator.registerBlock(Blocks.Names.COMPARISON.INTERVAL, (block, generator) => {
    const a = generator.valueToCode(block, "A", Order.ATOMIC) || "0"
    const b = generator.valueToCode(block, "B", Order.ATOMIC) || "0"
    const c = generator.valueToCode(block, "C", Order.ATOMIC) || "0"

    if(block.getInputTargetBlock("A")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("B")?.type === Blocks.Names.TIMELINE.DATE_PICKER || block.getInputTargetBlock("C")?.type === Blocks.Names.TIMELINE.DATE_PICKER) {
        return `(compareDates("after", ${a}, ${b}) && compareDates("before", ${a}, ${c}))`
    }

    return `((${a} > ${b}) && (${a} < ${c}))`
})