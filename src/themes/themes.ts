import * as Blockly from "blockly/core";
import { DefaultColors } from "./colors";
import dark from "./default-dark.json"

export const LightTheme = createBlocklyTheme("light", DefaultColors)
export const DarkTheme = createBlocklyTheme("dark", dark.colors)

export function createBlocklyTheme<T extends typeof DefaultColors>(name: string, colors: T): Blockly.Theme {
    return Blockly.Theme.defineTheme(name, {
        name: name,
        base: Blockly.Themes.Zelos,
        categoryStyles: {
            "comparisons_category": {
                colour: colors.categories.comparisons.bg
            },
            "variables_category": {
                colour: colors.categories.variables.bg
            },
            "favorites_category": {
                colour: colors.categories.variables.bg,
            },
            "nodes_category": {
                colour: colors.categories.nodes.bg
            },
            "logic_category": {
                colour: colors.categories.logic.bg
            },
            "history_category": {
                colour: colors.categories.timeline.bg
            },
            "primitives_category": {
                colour: colors.categories.nodes.bg
            },
            "math_category": {
                colour: colors.categories.math.bg
            },
            "lists_category": {
                colour: colors.categories.lists.bg
            }
        },
        blockStyles: {
            "variable_blocks": {
                colourPrimary: colors.categories.variables.bg,
                colourTertiary: colors.categories.variables.border
            },
            "comparisons_blocks": {
                colourPrimary: colors.categories.comparisons.bg,
                colourTertiary: colors.categories.comparisons.border
            },
            "node_blocks": {
                colourPrimary: colors.categories.nodes.bg,
                colourTertiary: colors.categories.nodes.border
            },
            "capped_node_blocks": {
                colourPrimary: colors.categories.nodes.bg,
                colourTertiary: colors.categories.nodes.border,
                hat: "cap"
            },
            "timeline_blocks": {
                colourPrimary: colors.categories.timeline.bg,
                colourTertiary: colors.categories.timeline.border
            },
            "logic_blocks": {
                colourPrimary: colors.categories.logic.bg,
                colourTertiary: colors.categories.logic.border
            },
            "math_blocks": {
                colourPrimary: colors.categories.math.bg,
                colourTertiary: colors.categories.math.border
            },
            "list_blocks": {
                colourPrimary: colors.categories.lists.bg,
                colourTertiary: colors.categories.lists.border
            },
        },
        componentStyles: {
            toolboxBackgroundColour: colors.menu.bg.default,
            flyoutBackgroundColour: colors.toolbox.bg
        },
        fontStyle: {
            family: "Roboto, sans-serif",
            weight: "normal",
            size: 12
        }
    })
}