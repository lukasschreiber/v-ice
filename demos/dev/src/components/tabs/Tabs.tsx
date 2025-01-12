import React, { useContext } from "react";
import { TabContext } from "./TabContext";

export function Tabs(props: React.HTMLProps<HTMLDivElement>) {
    const { setActiveTab, activeTab } = useContext(TabContext);

    return (
        <div {...props} className="flex flex-col h-full">
            <div>
                <div className="flex flex-row bg-gray-100">
                    {React.Children.toArray(props.children)
                        .filter((x) => (x as { type: unknown }).type === Tab)
                        .map((child, index) => {
                            const label = (child as React.ReactElement<{ label: string }>).props.label;
                            return (
                                <div
                                    key={index}
                                    onClick={() => setActiveTab(index)}
                                    className={`px-3 pt-1 pb-1 font-semibold text-xs text-gray-700 hover:bg-gray-50 cursor-pointer border-t-2 border-r border-b border-solid border-x-gray-200 border-y-gray-200 bg-gray-100 ${index === activeTab ? "border-t-primary border-b-0 bg-white" : ""}`}
                                >
                                    {label}
                                </div>
                            );
                        })}
                </div>
            </div>
            <div className="overflow-hidden grow">
                {React.Children.toArray(props.children).filter((x) => (x as { type: unknown }).type === Tab)[activeTab]}
            </div>
        </div>
    );
}

export function Tab(props: React.HTMLProps<HTMLDivElement> & { label: string, description: string }) {
    return (
        <div {...props} className="h-full flex flex-col">
            <div className="text-xs p-1 border-b border-solid border-gray-200">{props.description}</div>
            <div className="overflow-x-auto overflow-y-auto h-full box-border grow">
                {props.children}
            </div>
        </div>
    );
}
