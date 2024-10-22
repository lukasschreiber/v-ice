import {
    type LayoutSettings as layout,
} from "@/store/settings/settings_definition";

export type LayoutSettings = layout;

export type Settings = { [K in keyof LayoutSettings]: LayoutSettings[K]["default"] };
type SettingLayoutTypes = "range" | "text" | "checkbox" | "color" | "radio";

export interface LayoutGroup {
    settings: Partial<LayoutSettings>;
    name: string;
}

export interface Setting<T> {
    type: SettingLayoutTypes;
    default: T;
    helpText?: string;
    label: string;
    hidden?: boolean | ((settings: Settings) => boolean);
}

export interface RangeSetting extends Setting<number> {
    type: "range";
    min: number;
    max: number;
    stepSize?: number;
}

export interface TextSetting extends Setting<string> {
    type: "text";
}

export interface CheckboxSetting extends Setting<boolean> {
    type: "checkbox";
}

export interface ColorSetting extends Setting<string> {
    type: "color";
}

export interface RadioSetting extends Setting<string> {
    type: "radio";
    options: { label: string; value: string }[];
}

export function defineSettings(settings: LayoutGroup[]) {
    return settings;
}

export function isRangeSetting(setting: Setting<unknown>): setting is RangeSetting {
    return setting.type === "range";
}

export function isTextSetting(setting: Setting<unknown>): setting is TextSetting {
    return setting.type === "text";
}

export function isCheckboxSetting(setting: Setting<unknown>): setting is CheckboxSetting {
    return setting.type === "checkbox";
}

export function isColorSetting(setting: Setting<unknown>): setting is ColorSetting {
    return setting.type === "color";
}

export function isRadioSetting(setting: Setting<unknown>): setting is RadioSetting {
    return setting.type === "radio";
}

export function getDefaultSettings(layout: LayoutGroup[]): Settings {
    const defaultSettings: Partial<Settings> = {};

    for (const group of layout) {
        Object.assign(
            defaultSettings,
            Object.fromEntries(
                (Object.keys(group.settings) as (keyof LayoutSettings)[]).reduce<
                    [keyof Settings, Settings[keyof Settings]][]
                >((accumulator, current) => {
                    const value = group.settings[current];
                    if (value === undefined) return accumulator;
                    accumulator.push([current, value.default]);
                    return accumulator;
                }, [])
            ) as Settings
        );
    }

    return defaultSettings as Settings;
}