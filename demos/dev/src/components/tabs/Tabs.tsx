import React, { useContext } from "react";
import { TabContext } from "./TabContext";
import DockBottom from "../../assets/dock-bottom.svg?react";
import DockRight from "../../assets/dock-right.svg?react";

export function Tabs(props: React.HTMLProps<HTMLDivElement> & { orientation: "horizontal" | "vertical", setOrientation: (orientation: "horizontal" | "vertical") => void }) {
    const { setActiveTab, activeTab } = useContext(TabContext);

    return (
        <div {...props} className="flex flex-col h-full">
            <div>
                <div className="flex flex-row bg-gray-100 w-full justify-between">
                    <div className="flex flex-row shrink-1 overflow-x-auto">
                        {React.Children.toArray(props.children)
                            .filter((x) => (x as { type: unknown }).type === Tab)
                            .map((child, index) => {
                                const label = (child as React.ReactElement<{ label: string }>).props.label;
                                return (
                                    <div
                                        key={index}
                                        onClick={() => setActiveTab(index)}
                                        className={`px-3 pt-1 pb-1 font-semibold text-xs text-gray-700 hover:bg-gray-50 cursor-pointer border-t-2 border-r border-b border-solid border-x-gray-200 border-y-gray-200 bg-gray-100 ${
                                            index === activeTab ? "border-t-primary border-b-0 bg-white" : ""
                                        }`}
                                    >
                                        {label}
                                    </div>
                                );
                            })}
                    </div>
                    <div className="flex flex-row items-center border border-gray-200 overflow-hidden cursor-pointer text-gray-800 w-fit shrink-0">
                        <div className={`flex items-center justify-center h-full p-0.5 px-1 ${props.orientation === "vertical" ? "bg-gray-300" : "bg-white"}`} onClick={() => props.setOrientation("vertical")}>
                            <DockBottom className="w-4 h-4" />
                        </div>
                        <div className={`flex items-center justify-center h-full p-0.5 px-1 ${props.orientation === "horizontal" ? "bg-gray-300" : "bg-white"}`} onClick={() => props.setOrientation("horizontal")}>
                            <DockRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-hidden grow">
                {React.Children.toArray(props.children).filter((x) => (x as { type: unknown }).type === Tab)[activeTab]}
            </div>
        </div>
    );
}

export function Tab(props: React.HTMLProps<HTMLDivElement> & { label: string; description: string }) {
    return (
        <div {...props} className="h-full flex flex-col">
            <div className="text-xs p-1 border-b border-solid border-gray-200">{props.description}</div>
            <div className="overflow-x-auto overflow-y-auto h-full box-border grow">{props.children}</div>
        </div>
    );
}
