import { HTMLProps, createRef, useState } from "react";
import { CustomOption } from "./CustomOption";
import { Field } from "./Field";

export function CheckboxList(
    props: HTMLProps<HTMLFieldSetElement> & {
        label: string;
        options: string[];
        values: string[] | undefined;
        onValueUpdate: (value: string[]) => void;
    }
) {
    const { label, options, values, onValueUpdate, ...rest } = props;
    const [customValue, setCustomValue] = useState<string>(values?.find((v) => v !== "" && !options.includes(v)) ?? "");
    const customOptionRef = createRef<HTMLInputElement>();

    return (
        <Field label={label} {...rest}>
            {options.map((option, index) => {
                if (option.startsWith("CUSTOM")) {
                    const placeholder = option.split(":")[1].trim() || "Andere (bitte angeben)";
                    const key = `custom-${index}`;
                    return (
                        <label key={key} className="flex flex-row gap-1 w-fit">
                            <input
                                type="checkbox"
                                name={label}
                                value={customValue}
                                checked={values?.includes(customValue) ?? false}
                                ref={customOptionRef}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    if (values?.includes(newValue)) {
                                        onValueUpdate(values.filter((v) => v !== newValue));
                                    } else {
                                        onValueUpdate([...(values || []), newValue]);
                                    }
                                }}
                            />
                            <CustomOption
                                placeholder={placeholder}
                                type="text"
                                className="w-full"
                                value={customValue ?? ""}
                                onChange={(e) => {
                                    customOptionRef.current!.checked = true;
                                    const newValue = (e.target as HTMLInputElement).value;
                                    onValueUpdate([...(values || []).filter((v) => options.includes(v) && v !== ""), newValue]);
                                    setCustomValue(newValue);
                                }}
                                onClick={() => {
                                    customOptionRef.current!.checked = true;
                                }}
                            />
                        </label>
                    );
                }

                return (
                    <label key={option} className="flex flex-row gap-1 w-fit">
                        <input
                            type="checkbox"
                            name={label}
                            value={option}
                            checked={values?.includes(option) ?? false}
                            onChange={() => {
                                if (values?.includes(option)) {
                                    onValueUpdate(values.filter((v) => v !== option));
                                } else {
                                    onValueUpdate([...(values || []), option]);
                                }
                            }}
                        />
                        {option}
                    </label>
                );
            })}
        </Field>
    );
}
