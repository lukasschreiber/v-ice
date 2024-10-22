import { Blocks } from "@/blocks";
import { IType } from "@/main";
import * as Blockly from "blockly/core";
import { DateTime } from "luxon";
import t from "@/data/types";

// Yes, I named it ShadowFactory because it sounds cool (and creates shadows)
export class ShadowFactory {

    static addShadowToInput(input: Blockly.Input, type: IType, opt_updateChildOutputType: boolean = false): boolean {
        const shadow = ShadowFactory.createShadowForType(type)
        if (!shadow) return false

        const targetBlock = input.connection?.targetBlock()
        if (targetBlock && opt_updateChildOutputType) targetBlock.outputConnection?.setCheck(null)
        if(!this.isShadowEqual(input.getShadowDom(), shadow)) {
            input.setShadowDom(null)
            input.setCheck(type.name)
            input.setShadowDom(shadow)
        } else {
            input.setCheck(type.name)
        }
        if (targetBlock && opt_updateChildOutputType) targetBlock.outputConnection?.setCheck(type.name)

        return true
    }

    static createShadowForType(type: IType): Element | null {
        const element = Blockly.utils.xml.createElement("shadow")

        if (t.utils.isBoolean(type)) {
            element.setAttribute("type", Blocks.Names.LOGIC.BOOLEAN)
        } else if (t.utils.isTimestamp(type)) {
            element.setAttribute("type", Blocks.Names.TIMELINE.DATE_PICKER)
            element.textContent = DateTime.local().toFormat("yyyy-MM-dd'T'HH:mm:ss")
        } else if (t.utils.isNumber(type)) {
            element.setAttribute("type", Blocks.Names.MATH.NUMBER)
            const field = Blockly.utils.xml.createElement("field")
            field.setAttribute("name", "NUM")
            field.textContent = ""
            element.appendChild(field)
        } else if (t.utils.isEnum(type)) {
            element.setAttribute("type", Blocks.Names.ENUM.SELECT)
            const field = Blockly.utils.xml.createElement("field")
            field.setAttribute("name", "ENUM")
            const mutation = Blockly.utils.xml.createElement("mutation")
            mutation.setAttribute("variableType", type.name)
            element.appendChild(mutation)
            element.appendChild(field)
        } else if (t.utils.isHierarchy(type)) {
            element.setAttribute("type", Blocks.Names.HIERARCHY.SELECT)
            const field = Blockly.utils.xml.createElement("field")
            field.setAttribute("name", "HIERARCHY")
            const mutation = Blockly.utils.xml.createElement("mutation")
            mutation.setAttribute("variableType", type.name)
            element.appendChild(mutation)
            element.appendChild(field)
        } else if(t.utils.isList(type)) {
            element.setAttribute("type", Blocks.Names.LIST.IMMEDIATE)
            const mutation = Blockly.utils.xml.createElement("mutation")
            mutation.setAttribute("variableType", type.name)
            element.appendChild(mutation)
        } else if(t.utils.isStruct(type)) {
            element.setAttribute("type", Blocks.Names.STRUCTS.IMMEDIATE)
            const mutation = Blockly.utils.xml.createElement("mutation")
            mutation.setAttribute("variableType", type.name)
            element.appendChild(mutation)
        } else if(t.utils.isString(type)) {
            element.setAttribute("type", Blocks.Names.STRINGS.IMMEDIATE)
            const field = Blockly.utils.xml.createElement("field")
            field.setAttribute("name", "VALUE")
            field.textContent = ""
            element.appendChild(field)
        } else {
            return null
        }

        return element
    }

    protected static isShadowEqual(a: Element | null, b: Element | null): boolean {
        if(a === null && b === null) return true
        if(a === null || b === null) return false
        if(a.getAttribute("type") !== b.getAttribute("type")) return false
        if(a.querySelector("mutation")?.getAttribute("variableType") !== b.querySelector("mutation")?.getAttribute("variableType")) return false

        return true
    }
}