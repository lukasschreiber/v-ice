import { DependentDropdownOptionsChange } from '@/events/events_dependent_dropdown_options_change';
import * as Blockly from 'blockly/core';
import { FieldFilterableDynamicDropdown } from './field_filterable_dynamic_dropdown';
import { TypedField } from './field';
import types from '@/data/types';

/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Copied the original code and modified it to fit the needs of the project.
 * https://github.com/google/blockly-samples/blob/master/plugins/field-dependent-dropdown/src/field_dependent_dropdown.ts
 */

export interface IChildOptionMapping {
    [key: string]: Blockly.MenuOption[];
}

// This type isn't exported from Blockly so we have to derive it from the API.
type FieldConfig = Exclude<
    ConstructorParameters<typeof Blockly.Field>[2],
    undefined
>;

/** fromJson config for a dependent dropdown field. */
export interface FieldDependentDropdownFromJsonConfig extends FieldConfig {
    parentName: string;
    optionMapping: IChildOptionMapping;
    defaultOptions?: Blockly.MenuOption[];
}

interface IDependencyData {
    parentField?: Blockly.Field<string>;
    derivedOptions?: Blockly.MenuOption[];
}

export class FieldDependentDropdown extends FieldFilterableDynamicDropdown implements TypedField {
    dependencyData: IDependencyData;
    private parentName: string;
    private optionMapping: IChildOptionMapping;
    private defaultOptions?: Blockly.MenuOption[];

    constructor(
        parentName: string,
        optionMapping: IChildOptionMapping,
        defaultOptions?: Blockly.MenuOption[],
        validator?: Blockly.FieldValidator,
        config?: FieldConfig,
    ) {
        const dependencyData: IDependencyData = {};

        const menuGenerator: Blockly.MenuGeneratorFunction = () => {
            if (dependencyData.derivedOptions) {
                return dependencyData.derivedOptions;
            }

            if (dependencyData.parentField) {
                const value = dependencyData.parentField.getValue();
                if (value) {
                    const options = optionMapping[value];
                    if (options) {
                        return options;
                    }
                }
            }

            if (defaultOptions) {
                return defaultOptions;
            }

            // Fall back on basic default options.
            return [['', '']];
        };

        super(menuGenerator, validator, config);
        this.parentName = parentName;
        this.optionMapping = optionMapping;
        this.defaultOptions = defaultOptions;
        this.dependencyData = dependencyData;
    }

    static fromJson(
        options: FieldDependentDropdownFromJsonConfig,
    ): FieldDependentDropdown {
        return new FieldDependentDropdown(
            options.parentName,
            options.optionMapping,
            options.defaultOptions,
            undefined,
            options,
        );
    }

    getOutputType() {
        return types.string;
    }

    setSourceBlock(block: Blockly.Block) {
        super.setSourceBlock(block);

        const parentField: Blockly.Field<string> | null = block.getField(
            this.parentName,
        );

        if (!parentField) {
            throw new Error(
                'Could not find a parent field with the name ' +
                this.parentName +
                ' for the dependent dropdown.',
            );
        }

        this.dependencyData.parentField = parentField;

        const oldValidator = parentField.getValidator();

        parentField.setValidator((newValue) => {
            if (oldValidator) {
                const validatedValue = oldValidator(newValue);

                if (validatedValue === null) {
                    return null;
                }

                if (validatedValue !== undefined) {
                    newValue = validatedValue;
                }
            }
            this.updateOptionsBasedOnNewValue(newValue);
            return newValue;
        });
        this.updateOptionsBasedOnNewValue(parentField.getValue() ?? undefined);
    }

    private updateOptionsBasedOnNewValue(newValue: string | undefined): void {
        if (newValue == undefined) {
            return;
        }

        const block = this.getSourceBlock();
        if (!block) {
            throw new Error(
                'Could not validate a field that is not attached to a block: ' +
                this.name,
            );
        }

        const oldChildValue = this.getValue();
        const oldChildOptions = this.getOptions(false);
        let newChildOptions = this.optionMapping[newValue];
        if (!newChildOptions) {
            if (this.defaultOptions) {
                newChildOptions = this.defaultOptions;
            } else {
                console.warn(
                    'Could not find child options for the parent value: ' + newValue,
                );
                return;
            }
        }

        const newOptionsIncludeOldValue =
            newChildOptions.find((option) => option[1] == oldChildValue) != undefined;
        const newChildValue = newOptionsIncludeOldValue
            ? oldChildValue
            : newChildOptions[0][1];

        this.dependencyData.derivedOptions = newChildOptions;

        this.getOptions(false);

        Blockly.Events.disable();
        this.setValue(newChildValue);
        Blockly.Events.enable();

        if (Blockly.Events.getRecordUndo()) {
            if (!Blockly.Events.getGroup()) {
                Blockly.Events.setGroup(true);
                setTimeout(() => Blockly.Events.setGroup(false));
            }

              Blockly.Events.fire(
                new DependentDropdownOptionsChange(
                  block,
                  this.name,
                  oldChildValue ?? undefined,
                  newChildValue ?? undefined,
                  oldChildOptions,
                  newChildOptions,
                ),
              );
        }
    }
}

Blockly.fieldRegistry.register(
    'field_dependent_dropdown',
    FieldDependentDropdown,
);