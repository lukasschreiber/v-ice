import { IType } from "@/main";
import * as Blockly from "blockly/core";

export interface TypedField {
    getOutputType(): IType | null
}

export type RegistrableField = new (...args: any[]) => Blockly.Field & TypedField

export function isTypedField(field: Blockly.Field): field is TypedField & Blockly.Field {
    return "getOutputType" in field && typeof field.getOutputType === "function";
}