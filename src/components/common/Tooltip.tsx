import { Layer } from "@/utils/zindex";
import { HTMLProps, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Tooltip(
    props: HTMLProps<HTMLDivElement> & { text: string; distance?: number; position?: "left" | "right" }
) {
    const { text, distance = 10, position = "right", className, style, ...rest } = props;
    const [isHovered, setIsHovered] = useState(false);
    const targetRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div
                className="relative"
                ref={targetRef}
                {...rest}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {props.children}
            </div>
            {isHovered &&
                targetRef.current &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        className={`absolute bg-white border border-gray-300 px-1 py-1/2 rounded-md shadow-lg -translate-y-1/2 ${position === "left" ? "-translate-x-[100%]" : ""} ${className}`}
                        style={{
                            top: `${
                                targetRef.current.getBoundingClientRect().top +
                                targetRef.current.getBoundingClientRect().height / 2
                            }px`,
                            left: `${
                                position === "right"
                                    ? targetRef.current.getBoundingClientRect().left +
                                      targetRef.current.getBoundingClientRect().width + distance
                                    : targetRef.current.getBoundingClientRect().left - distance
                            }px`,
                            userSelect: "none",
                            pointerEvents: "none",
                            zIndex: Layer.Tooltips,
                            ...style,
                        }}
                    >
                        {text}
                    </div>,
                    document.body
                )}
        </>
    );
}
