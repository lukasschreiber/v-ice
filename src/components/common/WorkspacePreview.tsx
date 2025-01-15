import { useEffect, useRef } from "react";
import * as Blockly from "blockly/core";
import light_theme from "@/themes/light_theme";
import { Renderer } from "@/renderer/renderer";
import { ISerializedWorkspace } from "@/serializer";

export function WorkspacePreview(props: { workspace: ISerializedWorkspace, lazyLoadParentRef?: React.RefObject<HTMLElement> } & React.HTMLProps<HTMLDivElement>) {
    const div = useRef<HTMLDivElement>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

    const { workspace, lazyLoadParentRef, className, ...rest } = props;

    useEffect(() => {
        const loadWorkspace = () => {
            if (!div.current) {
                return;
            }

            if (!workspaceRef.current) {
                workspaceRef.current = Blockly.inject(div.current, {
                    readOnly: true,
                    theme: light_theme,
                    renderer: Renderer.name,
                });
            } else {
                workspaceRef.current.clear();
            }

            // normalize the blockpositions to always start at 0,0
            // this is especially import for negative positions
            if ("blocks" in workspace.workspaceState) {
                const blocks = (workspace.workspaceState.blocks as {blocks: { x: number, y: number }[]}).blocks;
                const minX = Math.min(...blocks.map((b: { x: number, y: number }) => b.x));
                const minY = Math.min(...blocks.map((b: { x: number, y: number }) => b.y));
                for (const block of blocks) {
                    block.x -= minX;
                    block.y -= minY;
                }
            }

            Blockly.serialization.workspaces.load(workspace.workspaceState, workspaceRef.current)

            workspaceRef.current.setScale(0.1);
            workspaceRef.current.render();

            const metrics = workspaceRef.current.getMetrics();
            const width = metrics?.contentWidth || 0;
            const height = metrics?.contentHeight || 0;


            // Adjust the size of the div to fit the block
            div.current.style.height = height + "px";
            div.current.style.width = width + "px";
            
            Blockly.svgResize(workspaceRef.current);
        };

        const handleIntersection = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadWorkspace();
                    observer.current?.disconnect();
                }
            });
        };

        if (div.current) {
            observer.current = new IntersectionObserver(handleIntersection, {
                root: lazyLoadParentRef?.current || null,
                threshold: 0.1,
            });

            observer.current.observe(div.current);
        }

        return () => {
            observer.current?.disconnect();
            // workspaceRef.current?.dispose();
        };
    }, [workspace, lazyLoadParentRef]);

    return (
        <div {...rest} className={`${className} block-preview w-full flex flex-col items-left`}  style={{ pointerEvents: "none", userSelect: "none" }}>
            <div ref={div}></div>
        </div>
    );
}
