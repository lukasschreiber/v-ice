import React from "react";

export function ButtonStack(props: React.HTMLProps<HTMLDivElement>) {
    return (
        <div className={`flex flex-col gap-2 items-end ${props.className}`}>
            {props.children}
        </div>
    );
}