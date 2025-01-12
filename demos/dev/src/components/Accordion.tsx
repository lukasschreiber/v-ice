import { useState } from "react";

export function Accordion(props: React.HTMLProps<HTMLDivElement> & { title: string; defaultOpen: boolean }) {
    const { title, defaultOpen, children, className, ...rest } = props;
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className={`${className}`} {...rest}>
            <div
                className="flex gap-2 items-center p-1 text-xs cursor-pointer border-b border-solid border-gray-200 uppercase font-semibold"
                onClick={() => setOpen(!open)}
            >
                <span>{open ? "▼" : "▶"}</span>
                <span>{title}</span>
            </div>
            {open && <div className="">{children}</div>}
        </div>
    );
}
