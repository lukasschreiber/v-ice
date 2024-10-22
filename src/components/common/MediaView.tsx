import { HTMLProps } from "react";

export function MediaView(props: HTMLProps<HTMLImageElement>) {
    if (props.src?.endsWith(".webm")) {
        return (
            <video autoPlay loop muted src={props.src} />
        )
    } else {
        return (
            <img {...props} className="!bg-transparent" />
        )
    }
}