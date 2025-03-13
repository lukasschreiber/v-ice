import { useSettings } from "@/main";
import { Layer } from "@/utils/zindex";
import React from "react";

export function ToolboxButton(props: React.HTMLProps<HTMLDivElement>) {
    const {className, children, ...rest} = props;
    return (
        <div className={`${className} font-bold flex text-xs items-center justify-center aspect-square cursor-pointer bg-primary`} {...rest} >
            {children}
        </div>
    );
}

export function ToolboxButtonStack(props: React.HTMLProps<HTMLDivElement>) {
    const { settings } = useSettings();
    return (
        <div className={`absolute bottom-0 pt-3 overflow-hidden ${settings.toolboxPosition === "left" ? "left-0" : "right-0"}`} style={{ zIndex: Layer.FloatingButtons }}>
            <div
                {...props}
                className="font-bold flex text-xs items-stretch justify-center shadow-top cursor-pointer"
            >
                <div className="w-full">{props.children}</div>
            </div>
        </div>
    );
}
