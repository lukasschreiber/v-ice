import React from "react";
import { createPortal } from "react-dom";

export interface ModalProps extends React.HTMLProps<HTMLDivElement> {
    open: boolean;
    onClose: () => void;
}

export function Modal(props: ModalProps) {
    const { open, onClose, ...rest } = props;

    return createPortal(
        <div
            className={`${
                open ? "" : "hidden"
            } backdrop-blur-sm left-0 right-0 fixed z-[10000000] top-0 bottom-0 modal-bg`}
            onClick={(e) => {
                if ((e.target as Element).classList.contains("modal-bg")) onClose();
            }}
        >
            <div
                {...rest}
                className="bg-white rounded-md border-slate-300 shadow-lg border-solid border absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:max-w-[90%] max-w-[600px] w-fit"
            >
                {props.children}
            </div>
        </div>,
        document.body
    );
}

export function ModalHeader(props: React.HTMLProps<HTMLDivElement>) {
    return <div {...props} className="p-2 border-b border-0 border-solid border-b-slate-200 font-bold" />;
}

export function ModalBody(props: React.HTMLProps<HTMLDivElement>) {
    return <div {...props} className="p-2" />;
}
