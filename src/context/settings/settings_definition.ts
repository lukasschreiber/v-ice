import i18next from "i18next";
import { CheckboxSetting, ColorSetting, RangeSetting, SelectSetting, TextSetting, defineSettings } from "@/context/settings/settings";

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
    toolboxPosition: SelectSetting<"left" | "right">
    showZoomControls: CheckboxSetting
    showCenterControl: CheckboxSetting
    showAutocomplete: CheckboxSetting
    showSettings: CheckboxSetting
    showManual: CheckboxSetting

    // Persistence
    saveWorkspace: CheckboxSetting
    persistenceKey: TextSetting
}

export function getSettingsDefinition() {
    const { t } = i18next
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
                toolboxPosition: {
                    type: "select",
                    default: "left",
                    label: "Toolbox Position",
                    options: [
                        { label: "Left", value: "left" },
                        { label: "Right", value: "right" },
                    ],
                    helpText: "Change the position of the toolbox",
                },
                showZoomControls: {
                    type: "checkbox",
                    default: true,
                    label: "Show Zoom Controls",
                    helpText: "Show the zoom controls",
                },
                showCenterControl: {
                    type: "checkbox",
                    default: true,
                    label: "Show the Center Button",
                    helpText: "Show the center control",
                },
                showAutocomplete: {
                    type: "checkbox",
                    default: true,
                    label: "Show Autocomplete",
                    helpText: "Show the autocomplete dropdown",
                },
                showSettings: {
                    type: "checkbox",
                    default: true,
                    label: "Show Settings",
                    helpText: "Show the settings button",
                },
                showManual: {
                    type: "checkbox",
                    default: true,
                    label: "Show Manual",
                    helpText: "Show the manual button",
                }

            }
        },
        {
            name: "Persistence",
            settings: {
                saveWorkspace: {
                    type: "checkbox",
                    default: true,
                    label: "Save Workspace",
                    helpText: "Save the workspace to local storage",
                },
                persistenceKey: {
                    type: "text",
                    default: "vice-workspace",
                    label: "Persistence Key",
                    helpText: "Change the key used to save the workspace",
                }
            }
        }
    ])
}