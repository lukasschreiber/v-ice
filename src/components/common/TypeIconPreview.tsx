import { IconFactory } from "@/blocks/icon_factory";
import types from "@/data/types";
import React from "react";

export function TypeIconPreview(props: { type: string }) {
    const path = IconFactory.createIconForType(types.utils.fromString(props.type), "#db6e00", "#ff8c1a")!;
    const bbox = IconFactory.measurePath(path);

    const convertAttributes = (attributes: NamedNodeMap) => {
        const attrs: Record<string, any> = {};
        for (let i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            const name = attr.name === "class" ? "className" : attr.name;
            attrs[name] = attr.value;
        }
        return attrs;
    };

    return (
        <span className="inline-flex items-center justify-center p-1 bg-[#ff8c1a] w-6 h-6 rounded-md align-bottom">
            <svg width={bbox.width} height={bbox.height} viewBox={`0 0 ${bbox.width} ${bbox.height}`}>
                {React.createElement(
                    path.tagName,
                    {...convertAttributes(path.attributes), transform: "translate(0.5 0.5)"},
                    Array.from(path.childNodes).map((child, index) => {
                        return React.createElement(
                            (child as SVGElement).tagName,
                            {...convertAttributes((child as SVGElement).attributes), key: index},
                            null
                        );
                    })
                )}
                {/* <path
                    d={path.getAttribute("d")!}
                    fill={path.getAttribute("fill")!}
                    fillRule={path.getAttribute("fill-rule")! as "evenodd" | "nonzero"}
                    stroke={path.getAttribute("stroke")!}
                    strokeWidth={path.getAttribute("stroke-width")!}
                    transform="translate(0.5 0.5)"
                /> */}
            </svg>
        </span>
    );
}
