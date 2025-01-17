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
                colour: colors.categories.comparisons
            },
            "variables_category": {
                colour: colors.categories.variables
            },
            "nodes_category": {
                colour: colors.categories.nodes
            },
            "logic_category": {
                colour: colors.categories.logic
            },
            "history_category": {
                colour: colors.categories.timeline
            },
            "primitives_category": {
                colour: colors.categories.nodes
            }
        },
        blockStyles: {
            "variable_blocks": {
                colourPrimary: colors.categories.variables
            },
            "comparisons_blocks": {
                colourPrimary: colors.categories.comparisons
            },
            "node_blocks": {
                colourPrimary: colors.categories.nodes,
            },
            "capped_node_blocks": {
                colourPrimary: colors.categories.nodes,
                hat: "cap"
            },
            "timeline_blocks": {
                colourPrimary: colors.categories.timeline
            },
            "logic_blocks": {
                colourPrimary: colors.categories.logic,
                colourSecondary: colors.categories.logic,
                colourTertiary: colors.categories.logic_dark
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