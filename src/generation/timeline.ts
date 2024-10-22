import { Blocks } from "@/blocks"
import { Order, queryGenerator } from "./query_generator"
import * as Blockly from "blockly/core"
import { EventOp } from "./timeline_templates"
import { parseDate } from "@/utils/datetime"

queryGenerator.registerBlock(Blocks.Names.TIMELINE.QUERY, (block, generator) => {
    const template = generator.multilineStatementToCode(block, "QUERY")
    const timeline = generator.valueToCode(block, "TIMELINE", 0)
    return `matchTimeline(${template === "" ? "[]": `[\n${generator.suffixLines(template, ",")}\n]`}, preprocessTimeline(${timeline === "" ? "[]": timeline}))`
})

queryGenerator.registerBlock(Blocks.Names.TIMELINE.EVENT_OCCURS, (block, generator) => {
    const event = generator.valueToCode(block, "EVENT", 0) || "{}"
    const op = block.getFieldValue("OP")

    if (op === EventOp.DOES_NOT_OCCUR_FOR) {
        return `{type_: "no_event", event: ${event}, duration: ${generator.valueToCode(block, "TIME", 0)}, unit: "${block.getFieldValue("TIME_UNIT")}" }`
    }

    return `{type_: "event", event: ${event}, op: "${op}"}`
})

queryGenerator.registerBlock(Blocks.Names.TIMELINE.EVENT_OCCURS_MATCH, (block, generator) => {
    const op = block.getFieldValue("OP")
    const query = generator.multilineStatementToCode(block, "QUERY", " && ")
    const localVariable = block.getFieldValue("VALUE")
    const subject = block.getFieldValue("SUBJECT")

    let eventQuery = `(${localVariable}) => (${query || "true"})`

    if (subject === "EVENT") {
        if (op === EventOp.DOES_NOT_OCCUR_FOR) {
            return `{type_: "no_event", event: ${eventQuery}, duration: ${generator.valueToCode(block, "TIME", 0)}, unit: "${block.getFieldValue("TIME_UNIT")}" }`
        }
    
        return `{type_: "event", event: ${eventQuery}, op: "${op}"}`
    } else if (subject === "START") {
        if (op === EventOp.DOES_NOT_OCCUR_FOR) {
            return `{type_: "no_interval", event: ${eventQuery}, limit: "start", duration: ${generator.valueToCode(block, "TIME", 0)}, unit: "${block.getFieldValue("TIME_UNIT")}" }`
        }

        return `{type_: "interval", event: ${eventQuery}, op: "${op}", limit: "start"}`
    } else {
        if (op === EventOp.DOES_NOT_OCCUR_FOR) {
            return `{type_: "no_interval", event: ${eventQuery}, limit: "end", duration: ${generator.valueToCode(block, "TIME", 0)}, unit: "${block.getFieldValue("TIME_UNIT")}" }`
        }

        return `{type_: "interval", event: ${eventQuery}, op: "${op}", limit: "end"}`
    }
})


queryGenerator.registerBlock(Blocks.Names.TIMELINE.EVENT_PICKER, (block) => {
    return [`"${block.getFieldValue("EVENT")}"`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.TIMELINE.TIMESTAMP, (block, generator) => {
    return `{type_: "date", timestamp: ${generator.valueToCode(block, "TIMESTAMP", 0)}}`
})

queryGenerator.registerBlock(Blocks.Names.TIMELINE.DATE_PICKER, (block) => {
    const {timestamp, maskedEntries} = parseDate(block.getFieldValue("TIMESTAMP")) // we need to have a granularity field in the date type
    return [`{timestamp: "${timestamp}", masked: [${maskedEntries.map(e => `"${e}"`)}]}`, Order.ATOMIC]
})

queryGenerator.registerBlock(Blocks.Names.TIMELINE.AFTER, (block, generator) => {
    return `{type_: "skip", duration: ${generator.valueToCode(block, "NUM", 0)}, unit: "${block.getFieldValue("UNIT")}", op: "${block.getFieldValue("OP")}"}`
})

queryGenerator.registerBlock(Blocks.Names.TIMELINE.AFTER_INTERVAL, (block, generator) => {
    return `{type_: "skip_interval", minDuration: ${generator.valueToCode(block, "START", 0)}, maxDuration: ${generator.valueToCode(block, "END", 0)}, unit: "${block.getFieldValue("UNIT")}" }`
})

queryGenerator.registerBlock(Blocks.Names.TIMELINE.EITHER_OR, (block, generator) => {
    const options = block.inputList.filter(input => input.type === Blockly.inputs.inputTypes.STATEMENT)
        .map(input => `[${generator.multilineStatementToCode(block, input.name).trim()}]`)
    return `{type_: "options", options: [${options.join(", ")}]}`
})

queryGenerator.registerBlock(Blocks.Names.TIMELINE.LOOP_UNTIL, (block, generator) => {
    return `{type_: "loop_until", untilType: ${generator.valueToCode(block, "EVENT", 0)}, template: [${generator.multilineStatementToCode(block, "TEMPLATE").trim()}]}`
})

queryGenerator.registerBlock(Blocks.Names.TIMELINE.LOOP_COUNT, (block, generator) => {
    return `{type_: "loop_count", count: ${generator.valueToCode(block, "NUM", 0)}, template: [${generator.multilineStatementToCode(block, "TEMPLATE").trim()}]}`
})