import * as Blockly from "blockly/core";
import { Colors } from "@/themes/colors";

export const LIGHT = "light"

export default Blockly.Theme.defineTheme(LIGHT, {
    name: LIGHT,
    base: Blockly.Themes.Zelos,
    categoryStyles: {
        "comparisons_category": {
            colour: Colors.categories.comparisons
        },
        "variables_category": {
            colour: Colors.categories.test
        },
        "nodes_category": {
            colour: Colors.categories.nodes
        },
        "logic_category": {
            colour: Colors.categories.logic
        },
        "history_category": {
            colour: Colors.categories.history
        },
    },
    blockStyles: {
        "variable_blocks": {
            colourPrimary: Colors.categories.test
        },
        "variable_blocks_nullable": {
            colourPrimary: "#fff",
            colourSecondary: Colors.categories.test,
        },
        "node_blocks": {
            colourPrimary: Colors.categories.nodes,
        },
        "capped_node_blocks": {
            colourPrimary: Colors.categories.nodes,
            hat: "cap"
        },
        "logic_blocks": {
            colourPrimary: Colors.categories.logic,
            colourSecondary: Colors.categories.logic,
            colourTertiary: Colors.categories.logic_dark
        },
    },
    componentStyles: {
        toolboxBackgroundColour: Colors.menu.background,
        flyoutBackgroundColour: Colors.background
    },
    fontStyle: {
        family: "Roboto, sans-serif",
        weight: "normal",
        size: 12
    }
})