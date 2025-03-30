import { GenericBlockDefinition, IDynamicToolboxCategory, IsHiddenFunc, IStaticToolboxCategory } from "../builder/definitions";
import { DynamicToolboxCategory } from "../categories/dynamic_category";
import { AbstractToolboxAdapter } from "./abstract_adapter";
import * as Blockly from "blockly/core";

type DynamicToolboxItem = Blockly.utils.toolbox.ToolboxItemInfo & { isHidden: IsHiddenFunc, register: (workspace: Blockly.WorkspaceSvg) => void }
type ToolboxItem = Blockly.utils.toolbox.ToolboxItemInfo & { isHidden: IsHiddenFunc }

export class BlocklyToolboxAdapter extends AbstractToolboxAdapter<Blockly.utils.toolbox.ToolboxDefinition, DynamicToolboxItem, ToolboxItem, ToolboxItem> {

    dynamicCategoryAdapter<C extends DynamicToolboxCategory>(category: IDynamicToolboxCategory<C>): DynamicToolboxItem {
        const uid = Blockly.utils.idGenerator.genUid();
        return {
            kind: "category",
            name: category.name,
            custom: uid,
            categorystyle: category.style,
            isHidden: category.isHidden ?? false,
            register: (workspace: Blockly.WorkspaceSvg) => {
                workspace.registerToolboxCategoryCallback(uid, (workspace: Blockly.WorkspaceSvg) => {
                    return category.instance.getBlocks(workspace).map(block => this.blockAdapter(block));
                });
            }
        }
    }

    staticCategoryAdapter(category: IStaticToolboxCategory): ToolboxItem {
        return {
            kind: "category",
            name: category.name,
            categorystyle: category.style,
            contents: category.blocks.map(block => this.blockAdapter(block)),
            isHidden: category.isHidden ?? false
        }
    }

    blockAdapter(block: GenericBlockDefinition): ToolboxItem {
        const inputs: { [key: string]: Blockly.serialization.blocks.ConnectionState } | undefined = block.inputs ? Object.entries(block.inputs).map(([name, input]) => {
            return {
                [name]: {
                    shadow: input.shadow ? this.blockAdapter(input.shadow) as Blockly.serialization.blocks.State : undefined,
                    block: input.block ? this.blockAdapter(input.block) as Blockly.serialization.blocks.State : undefined
                }
            }
        }).reduce((acc, input) => {
            return {
                ...acc,
                ...input
            }
        }, {}) : undefined

        const fields = block.fields
            ? Object.entries(block.fields).reduce((acc, [name, field]) => {
                acc[name] = Object.keys(field).length === 1 ? field.value : { ...field, value: field.value };
                return acc;
            }, {} as { [key: string]: string | number | boolean | null | { [key: string]: unknown } })
            : undefined;

        return {
            kind: "block",
            type: block.type,
            fields,
            inputs,
            isHidden: block.isHidden || false
        }
    }
}