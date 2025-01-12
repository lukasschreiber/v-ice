export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button {...props} className={`${props.className} ${!props.className?.includes("bg-") ? "bg-primary/15" : ""} px-1.5 py-0.5 rounded-md text-primary disabled:opacity-50 text-sm`}>
            {props.children}
        </button>
    );
}
