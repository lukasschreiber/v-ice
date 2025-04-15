import { GenericBlockDefinition } from "@/toolbox/builder/definitions";
import { hashString } from "./hash";

export function getToolboxBlockId(block: GenericBlockDefinition) {
    return hashString(block, (hash) => "toolbox-" + hash);
}