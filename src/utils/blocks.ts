import { GenericBlockDefinition } from "@/toolbox/builder/definitions";
import * as Blockly from "blockly/core";

export function getBlockText(block: Blockly.Block): string {
    // get all of the visible text in the block
    const fields = block.inputList.flatMap((input) => {
        input.fieldRow.map((field) => {
            return field.getText();
        })
    }).join(" ");
    return fields;
}

export function getBlockTextFromBlockDefinition(block: GenericBlockDefinition): string {
    // get all of the visible text in the block
    let result = "";
    if (block.fields) {
        for (const field of Object.values(block.fields)) {
            if (field.value) {
                result += field.value + " ";
            }
            if (field.name) {
                result += field.name + " ";
            }
        }
    }

    if (block.inputs) {
        for (const input of Object.values(block.inputs)) {
            if (input.block) {
                result += getBlockTextFromBlockDefinition(input.block) + " ";
            }
        }
    }
    return result.trim();
}