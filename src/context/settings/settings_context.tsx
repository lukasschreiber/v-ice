import { createContext, useEffect, useState } from "react";
import { LayoutGroup, Settings, getDefaultSettings } from "@/context/settings/settings";
import { useDispatch, useSelector } from "@/store/hooks";
import { setSettings } from "@/context/settings/settings_slice";
import { getSettingsDefinition } from "@/context/settings/settings_definition";
import { EvaluationAction, triggerAction } from "@/evaluation_emitter";

export interface IPublicSettingsContext {
    settings: Settings;
    set<K extends keyof Settings>(key: K, value: Settings[K]): void;
    isInitialized: boolean;
}

export type VisibilityOverrides = { [key in keyof Settings]?: boolean };

interface ISettingsContext extends IPublicSettingsContext {
    layout: LayoutGroup[];
    isHidden<K extends keyof Settings>(key: K): boolean;
    setInitialSettings(settings: Partial<Settings>): void;
    overrideVisibility(visibilityOverrides: VisibilityOverrides): void;
    defaultSettings: Settings;
}

export const SettingsContext = createContext<ISettingsContext>({
    layout: [],
    settings: {} as Settings,
    defaultSettings: {} as Settings,
    set: () => {},
    isHidden: () => false,
    isInitialized: false,
    setInitialSettings: () => {},
    overrideVisibility: () => {},
});

interface PersistedSettings {
    settings: Settings;
    modified: boolean;
}

export function SettingsProvider(
    props: React.ComponentPropsWithoutRef<"div">
) {
    const layout = getSettingsDefinition();
    const dispatch = useDispatch()
    const settings = useSelector(state => state.settings.settings)
    const LOCAL_STORAGE_KEY = "settings";
    const [initialSettings, setInitialSettings] = useState<Partial<Settings>>({});
    const [isInitialized, setIsInitialized] = useState(false);
    const [visibilityOverrides, setVisibilityOverrides] = useState<VisibilityOverrides>({});
    const [defaultSettings, setDefaultSettings] = useState<Settings>({} as Settings);

    function readSettingsFromLocalstorage(): [exists: boolean, modified: boolean] {
        const entry = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (entry === null) return [false, false];
        const { settings, modified } = JSON.parse(entry) as PersistedSettings;
        const mergedSettings = { ...defaultSettings, ...settings };

        dispatch(setSettings(mergedSettings));
        return [true, modified];
    }

    function writeSettingsToLocalstorage(settings: Settings, modified = false) {
        const entry: PersistedSettings = { settings, modified };
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entry));
    }

    useEffect(() => {
        const defaultSettings = getDefaultSettings(layout, initialSettings);
        dispatch(setSettings(defaultSettings))
        setDefaultSettings(defaultSettings);
        const [exists, modified] = readSettingsFromLocalstorage();
        if (!exists || !modified) {
            writeSettingsToLocalstorage(defaultSettings);
        }

        window.addEventListener("storage", (event: StorageEvent) => {
            if (event.key !== LOCAL_STORAGE_KEY || event.newValue === null) return;
            const entry = JSON.parse(event.newValue) as PersistedSettings;
            dispatch(setSettings(entry.settings));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSettings]);

    useEffect(() => {
        if (!isInitialized && Object.keys(settings).length > 0) {
            setIsInitialized(true);
        }
    }, [settings]);

    function set<K extends keyof Settings>(key: K, value: Settings[K]) {
        const newSettings = { ...settings };
        newSettings[key] = value;
        writeSettingsToLocalstorage(newSettings, true);

        if (key === "zoom") {
            triggerAction(EvaluationAction.ChangeZoom, { zoom: value as number });
        } else {
            triggerAction(EvaluationAction.ChangeSetting, { key, value });
        }

        dispatch(setSettings(newSettings))
    }

    function isHidden<K extends keyof Settings>(key: K): boolean {
        if (visibilityOverrides[key] !== undefined && visibilityOverrides[key] === false) return true;
        const setting = layout.find((group) => Object.keys(group.settings).includes(key))?.settings[key];
        if (setting === undefined) return false;
        if (typeof setting.hidden === "function") return setting.hidden(settings);
        return setting.hidden ?? false;
    }

    return (
        <SettingsContext.Provider value={{ isHidden, set, settings, layout, isInitialized, setInitialSettings, defaultSettings, overrideVisibility: setVisibilityOverrides }}>
            {props.children}
        </SettingsContext.Provider>
    );
}
