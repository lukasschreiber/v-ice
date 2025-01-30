import { Themes, getBlockDefinitionById, useSettings } from "v-ice";
import { useState } from "react";
import { Button } from "../Button";
import { ScreenshotModal } from "../ScreenshotModal";
import { BlockInfo, Toolbox, useWorkspace } from "@/main";
import { showNotification } from "@/context/notifications/notification_emitter";
import types from "@/data/types";
import { TypeIconPreview } from "@/components/common/TypeIconPreview";
import { Accordion } from "../Accordion";

export function MiscPanel(props: { theme: typeof Themes[keyof typeof Themes], setTheme: (theme: typeof Themes[keyof typeof Themes]) => void }) {
    const { settings, set } = useSettings();
    const { workspace, save, load } = useWorkspace();
    const [language, setLanguage] = useState(localStorage.getItem("language") ?? "en");
    const [screenshotModeEnabled, setScreenshotModeEnabled] = useState(false);


    return (
        <div className="p-3">
            <Accordion title="External Settings Test" defaultOpen={true}>
                <div className="flex flex-row gap-2 py-2">
                    <div>Zoom</div>
                    <input
                        type="range"
                        min={0.5}
                        max={3.0}
                        step={0.01}
                        value={settings.zoom}
                        onChange={(e) => set("zoom", parseFloat(e.target.value))}
                    />
                    <div>{settings.zoom.toFixed(2)}</div>
                </div>
            </Accordion>
            <Accordion title="Internationalization" defaultOpen={true}>
                <div className="flex flex-row gap-2 py-2">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-white rounded-sm border-slate-300 border border-solid"
                    >
                        <option value="de">German</option>
                        <option value="en">English</option>
                    </select>
                    <Button
                        onClick={() => {
                            localStorage.setItem("language", language);
                            location.reload();
                        }}
                        className="bg-slate-300 !text-slate-800"
                    >
                        Save Language and Reload
                    </Button>
                </div>
            </Accordion>
            <Accordion title="Themes" defaultOpen={true}>
                <div className="flex flex-row gap-2 py-2">
                    <select
                        value={Object.keys(Themes).find((key) => Themes[key as keyof typeof Themes] === props.theme)}
                        onChange={(e) => props.setTheme(Themes[e.target.value as keyof typeof Themes])}
                        className="bg-white rounded-sm border-slate-300 border border-solid"
                    >
                        {Object.keys(Themes).map((name) => {
                            return (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </Accordion>
            <Accordion title="Export Block Images" defaultOpen={true}>
                <div className="flex flex-row gap-2 py-2">
                    <Button
                        onClick={() => {
                            setScreenshotModeEnabled((old) => !old);
                        }}
                    >
                        Take a Block Screenshot
                    </Button>
                    <Button
                        onClick={() => {
                            const text = workspace
                                .getTopBlocks()
                                .map((block) => {
                                    const definition = Toolbox.utils.blockToBlockDefinition(block);
                                    return `::block-preview{block="${JSON.stringify(definition).replace(/"/g, "'")}"}`;
                                })
                                .join("\n");
                            navigator.clipboard.writeText(text);
                        }}
                    >
                        Copy MD Block Preview to Clipboard
                    </Button>
                </div>
            </Accordion>
            <Accordion title="Misc Functions" defaultOpen={false}>
                <div className="flex flex-row gap-2 py-2">
                    <Button
                        onClick={() => {
                            const state = save();
                            load(state);
                            showNotification("Workspace state restored");
                        }}
                    >
                        Reload
                    </Button>
                </div>
            </Accordion>
            <Accordion title="Type Icons" defaultOpen={false}>
                <div className="py-2">
                    <div className="flex flex-row gap-4">
                        <div className="flex flex-col space-y-4 text-xs">
                            <div className="flex items-center flex-col">Type</div>
                            <div className="h-6 flex items-center flex-col">I.</div>
                            <div className="h-6 flex items-center flex-col">II.</div>
                            <div className="h-6 flex items-center flex-col">III.</div>
                            <div className="h-6 flex items-center flex-col">IV.</div>
                        </div>
                        {[
                            [
                                types.number,
                                types.nullable(types.number),
                                types.list(types.number),
                                types.nullable(types.list(types.number)),
                            ],
                            [
                                types.string,
                                types.nullable(types.string),
                                types.list(types.string),
                                types.nullable(types.list(types.string)),
                            ],
                            [
                                types.boolean,
                                types.nullable(types.boolean),
                                types.list(types.boolean),
                                types.nullable(types.list(types.boolean)),
                            ],
                            [
                                types.struct(types.wildcard),
                                types.nullable(types.struct(types.wildcard)),
                                types.list(types.struct(types.wildcard)),
                                types.nullable(types.list(types.struct(types.wildcard))),
                            ],
                            [
                                types.hierarchy(types.wildcard),
                                types.nullable(types.hierarchy(types.wildcard)),
                                types.list(types.hierarchy(types.wildcard)),
                                types.nullable(types.list(types.hierarchy(types.wildcard))),
                            ],
                            // [types.enum(types.wildcard), types.nullable(types.enum(types.wildcard)), types.list(types.enum(types.wildcard)), types.nullable(types.list(types.enum(types.wildcard)))],
                            [
                                types.timestamp,
                                types.nullable(types.timestamp),
                                types.list(types.timestamp),
                                types.nullable(types.list(types.timestamp)),
                            ],
                            [
                                types.wildcard,
                                types.nullable(types.wildcard),
                                types.list(types.wildcard),
                                types.nullable(types.list(types.wildcard)),
                            ],
                            [types.event(types.enum(types.wildcard))],
                            [types.interval(types.enum(types.wildcard))],
                            [types.timeline(types.event(types.enum(types.wildcard)))],
                        ].map((types, colIndex) => {
                            return (
                                <div className="flex flex-col space-y-4" key={colIndex}>
                                    <div className="text-xs flex items-center justify-center">
                                        ({["a", "b", "c", "d", "e", "f", "g", "h", "i", "k", "m", "n"][colIndex]})
                                    </div>
                                    {types.map((type) => {
                                        return <TypeIconPreview key={type.name} type={type.name} />;
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Accordion>
            <Accordion title="Variables" defaultOpen={true}>
                <div className="flex flex-col gap-2">
                    {workspace && Toolbox.Categories.Variables.flyoutCategoryBlocks(workspace).filter((block) => block.kind === "block").map((_block) => {
                        const blockInfo = _block as BlockInfo;
                        const block = getBlockDefinitionById(blockInfo.type);

                        if (blockInfo.type !== "variable_get" || !block) return null;

                        const typeString = blockInfo.fields?.["VAR"]?.["type"];
                        const name = blockInfo.fields?.["VAR"]?.["name"];

                        return (
                            <div key={name} className="flex flex-col gap-1 py-2">
                                <div key={blockInfo.type} className="flex flex-row gap-2 py-2 text-xs font-bold items-center">
                                    <TypeIconPreview type={typeString} />
                                    <div>{name}</div>
                                </div>
                                <div className="font-mono text-xs">{typeString}</div>
                                <div className="text-xs text-gray-500">
                                    {types.utils.describe(types.utils.fromString(typeString))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Accordion>

            <ScreenshotModal open={screenshotModeEnabled} onClose={() => setScreenshotModeEnabled(false)} />
        </div>
    );
}
