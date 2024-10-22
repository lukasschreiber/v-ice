import { HTMLProps, createRef, useState } from "react";
import { CustomOption } from "./CustomOption";
import { Field } from "./Field";

export function RadioList(
    props: HTMLProps<HTMLFieldSetElement> & {
        label: string;
        options: string[];
        value: string | undefined;
        onValueUpdate: (value: string) => void;
    }
) {
    const { label, options, value, onValueUpdate, ...rest } = props;
    const [customValue, setCustomValue] = useState<string>((value !== undefined && value !== "" && options.includes(value)) ? "" : value!);
    const customOptionRef = createRef<HTMLInputElement>();

    return (
        <Field label={label} {...rest}>
            {options.map((option, index) => {
                if (option.startsWith("CUSTOM")) {
                    const placeholder = option.split(":")[1].trim() || "Andere (bitte angeben)";
                    const key = `custom-${index}`;
                    return (
                        <label key={key} className="flex flex-row gap-1">
                            <input
                                type="radio"
                                name={label}
                                value={customValue}
                                onChange={(e) => onValueUpdate(e.target.value)}
                                checked={value === customValue}
                                ref={customOptionRef}
                            />
                            <CustomOption
                                placeholder={placeholder}
                                type="text"
                                value={customValue ?? ""}
                                className="w-full"
                                onChange={(e) => {
                                    customOptionRef.current!.checked = true;
                                    setCustomValue((e.target as HTMLInputElement).value);
                                    onValueUpdate((e.target as HTMLInputElement).value)
                                }}
                                onClick={() => {
                                    customOptionRef.current!.checked = true;
                                }}
                            />
                        </label>
                    );
                }

                return (
                    <label key={option} className="flex flex-row gap-1">
                        <input
                            type="radio"
                            name={label}
                            value={option}
                            checked={value === option}
                            onChange={() => onValueUpdate(option)}
                        />
                        {option}
                    </label>
                );
            })}
        </Field>
    );
}
