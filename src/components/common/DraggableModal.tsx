import React, { createRef, useContext } from "react";
import Draggable from "react-draggable";
import CloseIcon from "@/assets/CloseIcon.svg?react";
import { SettingsContext } from "@/context/settings/settings_context";

export type ModalProps = React.HTMLProps<HTMLDivElement> & { open: boolean; onClose?: () => void};

export function ModalHeader(
    props: React.HTMLProps<HTMLDivElement> & { handle?: React.RefObject<HTMLDivElement>; onClose?: () => void }
) {
    const { handle, ...rest } = props;
    return (
        <div
            className="handle p-2 font-bold text-white cursor-grab bg-primary flex flex-row items-center"
            ref={handle}
            {...rest}
        >
            {props.children}
            <CloseIcon
                className="ml-auto cursor-pointer w-6 h-6 text-white p-1 rounded-sm hover:bg-white/20"
                onClick={() => props.onClose?.()}
            />
        </div>
    );
}

export function ModalContent(props: React.HTMLProps<HTMLDivElement>) {
    return <div className="overflow-auto flex flex-col">{props.children}</div>;
}

export function DraggableModal(props: ModalProps) {
    const handleRef = createRef<HTMLDivElement>();
    const { settings } = useContext(SettingsContext);
    const nodeRef = React.useRef<HTMLDivElement>(null);

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds={"parent"}
            handle=".handle"
            onStart={() => {
                if (handleRef.current) {
                    handleRef.current.classList.add("cursor-grabbing");
                    handleRef.current.classList.remove("cursor-grab");
                }
            }}
            onStop={() => {
                if (handleRef.current) {
                    handleRef.current.classList.add("cursor-grab");
                    handleRef.current.classList.remove("cursor-grabbing");
                }
            }}
        >
            <div
                ref={nodeRef}
                {...props}
                className={`${
                    props.open === true ? "block" : "hidden"
                } absolute z-[100003] shadow-lg border-slate-300 border rounded-md max-w-md flex flex-col overflow-hidden ${
                    props.className
                }`}
            >
                <div
                    className={`absolute top-0 bottom-0 left-0 right-0 -z-10 ${
                        settings.disableVisualEffects ? "bg-white" : "bg-white/50 backdrop-blur-sm"
                    }`}
                ></div>
                {React.Children.toArray(props.children)
                    .filter((x) => (x as { type: unknown }).type === ModalHeader)
                    .map((x, i) =>
                        React.cloneElement(x as React.ReactElement, {
                            key: i,
                            handle: handleRef,
                            onClose: () => props.onClose?.(),
                        })
                    )}
                {React.Children.toArray(props.children).filter((x) => (x as { type: unknown }).type === ModalContent)}
            </div>
        </Draggable>
    );
}
