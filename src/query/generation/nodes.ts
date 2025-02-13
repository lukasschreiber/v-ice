import { Blocks } from "@/blocks"
import { QueryGenerator, queryGenerator } from "../query_generator"
import { NodeBlock } from "@/blocks/extensions/node"
import { FieldSetSelection } from "@/blocks/fields/field_set_selection"

queryGenerator.registerNodeBlock(Blocks.Names.NODE.SET_ARITHMETIC, (block, generator) => {
    const name = "Subset"
    const procedureName = generator.getProcedureName(name)
    generator.registerFunctionName(block.id, procedureName)

    const left = processEdgeConnectionPoint("LEFT", block, generator)
    const right = processEdgeConnectionPoint("RIGHT", block, generator)
    const selection = (block.getField("SELECTION") as FieldSetSelection).getSelection()

    return { definition: `function ${procedureName}(left, right) {\n  return setArithmetic(left, right, ${generator.PARAM_NAME}, [${selection.map(it => `"${it}"`).join(", ")}]);\n}\n`, invocation: `${procedureName}(${left}, ${right})` }
})

function processEdgeConnectionPoint(inputName: string, block: NodeBlock, generator: QueryGenerator): string {
    const connection = block.edgeConnections.get(inputName)

    if (connection === undefined) {
        return generator.PARAM_NAME
    } else {
        const connections = connection.connections.map(conn => {
            const targetBlock = conn.getSourceBlock().id === block.id ? conn.targetBlock() : conn.getSourceBlock()

            if (targetBlock === null || !Blocks.Types.isNodeBlock(targetBlock)) {
                return null
            }

            if (targetBlock.type === Blocks.Names.NODE.SUBSET) {
                const isPositive = targetBlock.edgeConnections.get("POSITIVE")?.connections.includes(conn.targetConnection!)
                return `${generator.getFunctionEvaluatedName(targetBlock.id)}.${isPositive ? "positive" : "negative"}`
            }

            return generator.getFunctionEvaluatedName(targetBlock.id)
        }).filter(c => c !== null) as string[]

        if (connections.includes(generator.PARAM_NAME)) {
            return generator.PARAM_NAME
        } else if(connections.length === 0) {
            return "[]"
        } else if (connections.length === 1) {
            return connections[0]
        } else {
            return `merge(${connections.join(", ")})`
        }
    }
} 