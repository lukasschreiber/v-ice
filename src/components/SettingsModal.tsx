import { useContext, useEffect, useState } from "react";
import { DraggableModal, ModalContent, ModalHeader, ModalProps } from "./common/DraggableModal";
import { SettingsContext } from "@/store/settings/settings_context";
import { Setting, Settings, isCheckboxSetting, isColorSetting, isRangeSetting } from "@/store/settings/settings";
import { useTranslation } from "react-i18next";
import { EvaluationAction, triggerAction } from "@/evaluation_emitter";

export function SettingsModal(props: ModalProps) {
    const { settings, layout, isHidden, set } = useContext(SettingsContext);
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (props.open === true) triggerAction(EvaluationAction.OpenSettings)
    }, [props.open])

    function renderSettingsInput(setting: Setting<unknown>, key: keyof Settings) {
        if (isRangeSetting(setting)) {
            return (
                <div className="flex flex-col">
                    <label htmlFor={key} className="flex flex-row items-center gap-2">
                        <span>
                            {setting.label} - {(settings[key] as number).toFixed(2)}
                        </span>
                        <span className="text-sm cursor-pointer" onClick={() => set(key, setting.default)}>
                            [<span className="underline text-secondary">{setting.default}</span>]
                        </span>
                    </label>
                    <div className="flex flex-row text-xs items-center w-full text-slate-500 gap-1">
                        <div>{setting.min}</div>
                        <input
                            type="range"
                            id={key}
                            min={setting.min}
                            max={setting.max}
                            step={setting.stepSize}
                            value={settings[key] as number}
                            onChange={(e) => set(key, parseFloat(e.target.value))}
                            className="grow"
                        />
                        <div>{setting.max}</div>
                    </div>
                </div>
            );
        } else if (isCheckboxSetting(setting)) {
            return (
                <div className="flex flex-row gap-1">
                    <input
                        type="checkbox"
                        id={key}
                        checked={settings[key] as boolean}
                        onChange={(e) => {
                            set(key, e.target.checked);
                        }}
                    />
                    <label htmlFor={key}>{setting.label}</label>
                </div>
            );
        } else if (isColorSetting(setting)) {
            return (
                <div className="flex flex-row items-center gap-2">
                    <label htmlFor={key}>{setting.label}</label>
                    <input
                        type="color"
                        id={key}
                        value={settings[key] as string}
                        onChange={(e) => {
                            set(key, e.target.value);
                        }}
                    />
                    <span className="text-sm cursor-pointer" onClick={() => set(key, setting.default)}>
                        [<span className="underline text-secondary">{setting.default}</span>]
                    </span>
                </div>
            );
        }

        return <div>Nothing</div>;
    }

    return (
        <DraggableModal {...props} className="bottom-16 left-24 min-w-[400px]">
            <ModalHeader>{t("Settings")}</ModalHeader>
            <ModalContent>
                <div className="flex flex-row">
                    <div className="border-0 border-r border-solid border-slate-300">
                        {layout.map((group, index) => {
                            return (
                                <div className="py-2 px-4 cursor-pointer hover:bg-slate-200/50" key={index} onClick={() => setActiveTab(index)}>
                                    {group.name}
                                </div>
                            );
                        })}
                    </div>
                    <div className="py-2 px-4 min-h-[350px]">
                        {layout.map((group, index) => {
                            return (
                                <div key={index} className={activeTab === index ? "block" : "hidden"}>
                                    <div className="font-bold pb-1">{group.name}</div>
                                    <div className="flex flex-col gap-2">
                                        {Object.entries(group.settings)
                                            .filter(([key]) => !isHidden(key as keyof Settings))
                                            .map(([keyString, setting]) => {
                                                const key = keyString as keyof Settings;
                                                return (
                                                    <div key={key} className="border-0 border-b border-slate-300 border-solid pb-2 last-of-type:border-b-0">
                                                        {renderSettingsInput(setting, key)}
                                                        {setting.helpText && (
                                                            <div className="text-xs text-slate-500">
                                                                {setting.helpText}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </ModalContent>
        </DraggableModal>
    );
}
