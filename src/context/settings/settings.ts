import {
    type LayoutSettings as layout,
} from "@/context/settings/settings_definition";

export type LayoutSettings = layout;

export type Settings = { [K in keyof LayoutSettings]: LayoutSettings[K]["default"] };
type SettingLayoutTypes = "range" | "text" | "checkbox" | "color" | "radio" | "select";

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
    valueFormatter?: (value: T) => string;
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

export interface SelectSetting<T extends string> extends Setting<T> {
    type: "select";
    options: { label: string; value: T }[];
}

export function defineSettings(settings: LayoutGroup[]) {
    return settings;
}

export function isRangeSetting(setting: Setting<any>): setting is RangeSetting {
    return setting.type === "range";
}

export function isTextSetting(setting: Setting<any>): setting is TextSetting {
    return setting.type === "text";
}

export function isCheckboxSetting(setting: Setting<any>): setting is CheckboxSetting {
    return setting.type === "checkbox";
}

export function isColorSetting(setting: Setting<any>): setting is ColorSetting {
    return setting.type === "color";
}

export function isSelectSetting<T extends string>(setting: Setting<any>): setting is SelectSetting<T> {
    return setting.type === "select";
}

export function isRadioSetting(setting: Setting<any>): setting is RadioSetting {
    return setting.type === "radio";
}

export function getDefaultSettings(layout: LayoutGroup[], overrides: Partial<Settings> = {}): Settings {
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
                    const override = overrides[current];
                    const defaultValue = override === undefined ? value.default : override;
                    accumulator.push([current, defaultValue]);
                    return accumulator;
                }, [])
            ) as Settings
        );
    }

    return defaultSettings as Settings;
}