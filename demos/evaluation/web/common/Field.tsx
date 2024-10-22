import { HTMLProps } from "react";

export function Field(props: HTMLProps<HTMLFieldSetElement> & {label: string}) {
    const {label, children, ...rest} = props;

    return (
        <fieldset {...rest} className="flex flex-col gap-0.5">
            <legend className="font-semibold mb-2">{label}</legend>
            {children}
        </fieldset>
    );
}