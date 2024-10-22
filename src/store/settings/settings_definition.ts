import i18next from "i18next";
import { CheckboxSetting, ColorSetting, RangeSetting, defineSettings } from "@/store/settings/settings";

export interface LayoutSettings {
    // Blockly
    zoom: RangeSetting
    grid: CheckboxSetting
    gridSize: RangeSetting
    snapToGrid: CheckboxSetting
    gridColor: ColorSetting

    // Appearance
    disableVisualEffects: CheckboxSetting
    disableLinks: CheckboxSetting
}

export function getSettingsDefinition() {
    const t = i18next.t
    return defineSettings([
        {
            name: t("Blockly"),
            settings: {
                zoom: {
                    type: "range",
                    default: 0.8,
                    label: t("Zoom"),
                    min: 0.5,
                    max: 1.5,
                    stepSize: 0.001,
                    helpText: t("help.zoom"),
                },
                grid: {
                    type: "checkbox",
                    default: true,
                    label: "Grid",
                    helpText: "Enable or disable the grid",
                },
                snapToGrid: {
                    type: "checkbox",
                    default: true,
                    label: "Snap to Grid",
                    helpText: "Enable or disable snap to grid",
                },
                gridSize: {
                    type: "range",
                    default: 4,
                    label: "Marker Size",
                    min: 4,
                    max: 41,
                    stepSize: 0.5,
                    helpText: "Adjust the size of the grid",
                },
                gridColor: {
                    type: "color",
                    default: "#dddddd",
                    label: "Grid Color",
                    helpText: "Change the color of the grid",
                },
            }
        },
        {
            name: "Appearance",
            settings: {
                disableVisualEffects: {
                    type: "checkbox",
                    default: false,
                    label: "Disable Visual Effects",
                    helpText: "Remove all blur/transparency effects",
                },
                disableLinks: {
                    type: "checkbox",
                    default: false,
                    label: "Disable Edges",
                    helpText: "Remove all edges between blocks",
                },
            }
        }
    ])
}