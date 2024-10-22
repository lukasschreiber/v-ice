export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button {...props} className={`bg-primary px-1.5 py-0.5 rounded-md text-white disabled:opacity-50 text-sm ${props.className}`}>
            {props.children}
        </button>
    );
}
