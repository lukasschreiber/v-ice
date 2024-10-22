import React, { useContext } from "react";
import { TabContext } from "./TabContext";

export function Tabs(props: React.HTMLProps<HTMLDivElement>) {
    const { setActiveTab, activeTab } = useContext(TabContext);

    return (
        <div {...props} className="flex flex-col h-full">
            <div>
                <div className="flex flex-row shadow-lg">
                    {React.Children.toArray(props.children)
                        .filter((x) => (x as { type: unknown }).type === Tab)
                        .map((child, index) => {
                            const label = (child as React.ReactElement<{ label: string }>).props.label;
                            return (
                                <div
                                    key={index}
                                    onClick={() => setActiveTab(index)}
                                    className={`px-3 pt-3 pb-2 uppercase font-bold text-xs text-gray-700 hover:bg-gray-100 cursor-pointer ${index === activeTab ? "border-solid border-primary border-b-4 border-0 bg-primary/10" : ""}`}
                                >
                                    {label}
                                </div>
                            );
                        })}
                </div>
            </div>
            <div className="overflow-x-hidden grow">
                {React.Children.toArray(props.children).filter((x) => (x as { type: unknown }).type === Tab)[activeTab]}
            </div>
        </div>
    );
}

export function Tab(props: React.HTMLProps<HTMLDivElement> & { label: string }) {
    return (
        <div {...props} className="overflow-x-auto h-full box-border">
            {props.children}
        </div>
    );
}
