import { useEffect, useRef } from "react";
import * as Blockly from "blockly/core";
import { Renderer } from "@/renderer/renderer";
import { Blocks } from "@/blocks";
import { LightTheme } from "@/themes/themes";
import types from "@/data/types";
import { injectAcrossDocuments } from "@/blockly_inject_across_documents";
import { GenericBlockDefinition } from "@/blocks/toolbox/builder/definitions";
import { blockDefinitionToBlockState } from "@/blocks/toolbox/utils";
import { ExternalFlyout } from "@/toolbox/external_flyout";
import { ReactToolboxBlockItem } from "../toolbox/ReactToolboxBlockItem";

export function BlockPreview(props: { block: GenericBlockDefinition, lazyLoadParentRef?: React.RefObject<HTMLElement>, externalWindowRef?: React.RefObject<WindowProxy> }) {
    const div = useRef<HTMLDivElement>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const workspaceRef = useRef<ExternalFlyout | null>(null);
    const margin = 10;

    // useEffect(() => {
    //     const loadBlock = () => {
    //         if (!div.current) {
    //             return;
    //         }

    //         const doc = props.externalWindowRef?.current?.document || document

    //         if (!workspaceRef.current) {
    //             // workspaceRef.current = injectAcrossDocuments(div.current, doc, {
    //             //     readOnly: true,
    //             //     theme: LightTheme,
    //             //     renderer: Renderer.name,
    //             // });
    //             workspaceRef.current = new ExternalFlyout(new Blockly.Options({
    //                 readOnly: true,
    //                 theme: LightTheme,
    //                 renderer: Renderer.name,
    //             }), div.current);
    //         } else {
    //             workspaceRef.current.getWorkspace().clear();
    //         }

    //         const workspace = workspaceRef.current.getWorkspace();

    //         // workspace.setScale(0.9);

    //         const blockState = blockDefinitionToBlockState(props.block);

    //         const enumNames = Array.from(new Set([...JSON.stringify(props.block).matchAll(/Enum<.*?>/g)].map(match => match[0].replace("Enum<", "").replace(">", ""))));
    //         enumNames.forEach(enumName => {
    //             if (!types.registry.getEnum(enumName)) {
    //                 // TODO: This is a hack just for now, values must be inferred from the block definition
    //                 types.registry.registerEnum(enumName, ["Augsburg"]);
    //             }
    //         });

    //         const createUsedVariables = (block: Blockly.serialization.blocks.State) => {
    //             if (block.type === Blocks.Names.VARIABLE.GET) {
    //                 const variable = block.fields?.VAR;
    //                 if (variable) {
    //                     let id = variable.id;
    //                     if (!workspace.getVariableById(variable.id)) {
    //                         const newVariable = workspace.createVariable(variable.name, variable.type, variable.id);
    //                         id = newVariable.getId();
    //                     }

    //                     block.fields!["VAR"] = {
    //                         value: variable.name,
    //                         id: id,
    //                     };

    //                     block.fields!["TYPE"] = {
    //                         value: variable.type,
    //                     };
    //                 }
    //             }

    //             if (block.inputs) {
    //                 for (const inputName in block.inputs) {
    //                     const child = block.inputs[inputName];
    //                     if (child.block) createUsedVariables(child.block);
    //                     if (child.shadow) createUsedVariables(child.shadow);
    //                 }
    //             } else if (block.next) {
    //                 if (block.next.block) createUsedVariables(block.next.block);
    //                 if (block.next.shadow) createUsedVariables(block.next.shadow);
    //             } else {
    //                 return;
    //             }
    //         };

    //         createUsedVariables(blockState);
    //         // const block = Blockly.serialization.blocks.append(blockState, workspace, { recordUndo: false }) as Blockly.BlockSvg;

    //         // block.moveBy(margin, margin);
    //         // block.initSvg();
    //         // workspace.render();

    //         workspaceRef.current.addBlock(blockState);

    //         const metrics = workspace.getMetrics();
    //         const width = metrics?.contentWidth || 0;
    //         const height = metrics?.contentHeight || 0;


    //         // Adjust the size of the div to fit the block
    //         div.current.style.height = height + 2 * margin + "px";
    //         div.current.style.width = width + 2 * margin + "px";
            
    //         Blockly.svgResize(workspace);
    //     };

    //     const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    //         entries.forEach(entry => {
    //             if (entry.isIntersecting) {
    //                 loadBlock();
    //                 observer.current?.disconnect();
    //             }
    //         });
    //     };

    //     if (div.current) {
    //         observer.current = new IntersectionObserver(handleIntersection, {
    //             root: props.lazyLoadParentRef?.current || null,
    //             threshold: 0.1,
    //         });

    //         observer.current.observe(div.current);
    //     }

    //     return () => {
    //         observer.current?.disconnect();
    //         workspaceRef.current?.dispose();
    //     };
    // }, [props.block, props.lazyLoadParentRef]);

    return (
        <div className="block-preview w-full flex flex-col items-center">
            {/* <div ref={div}></div> */}
            <ReactToolboxBlockItem block={props.block} />
        </div>
    );
}
