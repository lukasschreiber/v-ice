import { createContext, useEffect } from "react";
import { LayoutGroup, Settings, getDefaultSettings } from "@/context/settings/settings";
import { useDispatch } from "react-redux";
import { useSelector } from "@/store/hooks";
import { setSettings } from "@/context/settings/settings_slice";
import { getSettingsDefinition } from "@/context/settings/settings_definition";
import { EvaluationAction, triggerAction } from "@/evaluation_emitter";

export interface IPublicSettingsContext {
    settings: Settings;
    set<K extends keyof Settings>(key: K, value: Settings[K]): void;
}

interface ISettingsContext extends IPublicSettingsContext {
    layout: LayoutGroup[];
    isHidden<K extends keyof Settings>(key: K): boolean;
}

export const SettingsContext = createContext<ISettingsContext>({
    layout: [],
    settings: {} as Settings,
    set: () => {},
    isHidden: () => false,
});


export function SettingsProvider(
    props: React.ComponentPropsWithoutRef<"div">
) {
    const layout = getSettingsDefinition();
    const dispatch = useDispatch()
    const settings = useSelector(state => state.settings.settings)
    const LOCAL_STORAGE_KEY = "settings";

    function readSettingsFromLocalstorage(): boolean {
        const entry = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (entry === null) return false;
        dispatch(setSettings(JSON.parse(entry) as Settings))
        return true;
    }

    function writeSettingsToLocalstorage(settings: Settings) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    }

    useEffect(() => {
        dispatch(setSettings(getDefaultSettings(layout)))
        if (!readSettingsFromLocalstorage()) {
            writeSettingsToLocalstorage(settings);
        }

        window.addEventListener("storage", (event: StorageEvent) => {
            if (event.key !== LOCAL_STORAGE_KEY || event.newValue === null) return;
            setSettings(JSON.parse(event.newValue) as Settings);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function set<K extends keyof Settings>(key: K, value: Settings[K]) {
        const newSettings = { ...settings };
        newSettings[key] = value;
        writeSettingsToLocalstorage(newSettings);

        if (key === "zoom") {
            triggerAction(EvaluationAction.ChangeZoom, { zoom: value as number });
        } else {
            triggerAction(EvaluationAction.ChangeSetting, { key, value });
        }

        dispatch(setSettings(newSettings))
    }

    function isHidden<K extends keyof Settings>(key: K): boolean {
        const setting = layout.find((group) => Object.keys(group.settings).includes(key))?.settings[key];
        if (setting === undefined) return false;
        if (typeof setting.hidden === "function") return setting.hidden(settings);
        return setting.hidden ?? false;
    }

    return (
        <SettingsContext.Provider value={{ isHidden, set, settings, layout }}>
            {props.children}
        </SettingsContext.Provider>
    );
}
