import React from "react";

export function RoundButton(props: React.HTMLProps<HTMLButtonElement>) {
    const {className, children, disabled, ...rest} = props;
    return (
        <button className={`bg-slate-100 p-2 cursor-pointer rounded-full h-10 w-10 text-slate-800 font-medium text-xs uppercase flex items-center justify-center ${disabled ? "opacity-50": ""} ${className}`} {...rest} disabled={disabled} type="button">
            {children}
        </button>
    );
}