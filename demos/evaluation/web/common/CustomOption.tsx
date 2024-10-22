import { HTMLProps } from "react";

export function CustomOption(props: HTMLProps<HTMLInputElement>) {
    const {className, ...rest} = props;
    return <label className="flex gap-2 w-full items-center">Sonstiges: <input {...rest} className={`${className} outline-none border border-gray-300 p-1 rounded-md max-w-[300px] w-full`} /></label>;
}