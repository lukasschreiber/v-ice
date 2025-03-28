import { Layer } from "@/utils/zindex";

export function Notification(props: { message: string }) {
    return (
        <div
            className="p-4 bg-gray-800/90 text-white absolute bottom-8rounded-md left-1/2 -translate-x-1/2"
            style={{ userSelect: "none", pointerEvents: "none", zIndex: Layer.Notifications }}
        >
            {props.message}
        </div>
    );
}
