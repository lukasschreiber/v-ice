import "@/blocks/fields"
import "@/blocks/extensions"
import "@/blocks/mutators"
import comparisonDefinitions from "@/blocks/definitions/comparisons"
import mathDefinitions from "@/blocks/definitions/math"
import variableDefinitions from "@/blocks/definitions/variables"
import nodeDefinitions from "@/blocks/definitions/nodes"
import enumDefinitions from "@/blocks/definitions/enums"
import logicDefinitions from "@/blocks/definitions/logic"
import listDefinitions from "@/blocks/definitions/lists"
import timelineDefinitions from "@/blocks/definitions/timeline"
import hierarchyDefinitions from "@/blocks/definitions/hierarchies"
import structDefinitions from "@/blocks/definitions/structs"
import stringDefinitions from "@/blocks/definitions/strings"

export const BlockDefinitions = {
    ...comparisonDefinitions,
    ...mathDefinitions,
    ...variableDefinitions,
    ...nodeDefinitions,
    ...enumDefinitions,
    ...logicDefinitions,
    ...listDefinitions,
    ...timelineDefinitions,
    ...hierarchyDefinitions,
    ...structDefinitions,
    ...stringDefinitions
}