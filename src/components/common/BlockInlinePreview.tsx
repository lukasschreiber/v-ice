import { useRef, useState } from "react";
import { BlockPreview } from "./BlockPreview";
import { createPortal } from "react-dom";
import { Layer } from "@/utils/zindex";
import { GenericBlockDefinition } from "@/blocks/toolbox/builder/definitions";

export function BlockInlinePreview(props: { block: GenericBlockDefinition; text: string, externalWindowRef?: React.RefObject<WindowProxy> }) {
    const [isHovered, setIsHovered] = useState(false);
    const inlineElementRef = useRef<HTMLSpanElement>(null);

    const doc = props.externalWindowRef?.current?.document || document;

    return (
        <span
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span
                className="underline underline-offset-4 decoration-dotted hover:bg-black/5"
                ref={inlineElementRef}
            >
                {props.text}
            </span>
            {isHovered &&
                createPortal(
                    <div className="markdown-body">
                        <div
                            className={`absolute w-fit py-1 top-0 left-0`}
                            style={{
                                zIndex: Layer.Tooltips + Layer.Modals,
                                transform: `translate(
                                    ${inlineElementRef.current!.getBoundingClientRect().left}px, 
                                    ${
                                        inlineElementRef.current!.getBoundingClientRect().top +
                                        inlineElementRef.current!.getBoundingClientRect().height
                                    }px)`,
                            }}
                        >
                            <div className={`p-4 bg-white border border-gray-200 shadow-lg rounded-md`}>
                                <BlockPreview block={props.block} />
                            </div>
                        </div>
                    </div>,
                    doc.body
                )}
        </span>
    );
}
