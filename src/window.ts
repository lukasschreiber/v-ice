import { TypeRegistry } from "./data/type_registry";
import { DateTime } from "luxon";

declare global {
    interface Window { Blockly: { typeRegistry: TypeRegistry }; luxon: { DateTime: DateTime } }
}

window.Blockly = window.Blockly || {}
window.luxon = window.luxon || {DateTime}
