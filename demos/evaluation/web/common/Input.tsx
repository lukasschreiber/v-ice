export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className, ...rest } = props;
    return (
        <input {...rest} className={`border border-gray-300 rounded-md px-1.5 py-0.5 outline-none ${className}`} />
    );
}