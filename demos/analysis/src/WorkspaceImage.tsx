import { useEffect, useRef } from "react";
import * as Blockly from "blockly/core";
import {LightTheme} from "@/themes/themes";
import { Renderer } from "@/renderer/renderer";
import { ISerializedWorkspace } from "v-ice";
import { deserializeWorkspace } from "@/serializer";
import { ContinuousMetrics } from "@/toolbox/metrics";
import { ContinuousToolbox } from "@/toolbox/toolbox";
import { ContinuousFlyout } from "@/toolbox/flyout";
import { BlockDragger } from "@/renderer/block_dragger";

export function WorkspaceImage(props: React.HTMLProps<HTMLDivElement> & { state: ISerializedWorkspace, lazyLoadParentRef?: React.RefObject<HTMLElement>, scale?: number }) {
    const div = useRef<HTMLDivElement>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const margin = 10;

    useEffect(() => {
        const loadBlock = () => {
            if (!div.current) {
                return;
            }

            if (!workspaceRef.current) {
                workspaceRef.current = Blockly.inject(div.current, {
                    readOnly: true,
                    theme: LightTheme,
                    renderer: Renderer.name,
                    zoom: {
                        startScale: props.scale ?? 0.3,
                    },
                    grid: {
                        colour: "#ffffff00",
                        snap: false
                    },
                    plugins: {
                        toolbox: ContinuousToolbox,
                        flyoutsVerticalToolbox: ContinuousFlyout,
                        metricsManager: ContinuousMetrics,
                        blockDragger: BlockDragger,
                    },
                });
            } else {
                workspaceRef.current.clear();
            }

            const workspace = workspaceRef.current; 
            // workspace.setScale(props.scale ?? 0.3);

            deserializeWorkspace(workspace, props.state);

            const metrics = workspace.getMetrics();
            const width = metrics?.contentWidth || 0;
            const height = metrics?.contentHeight || 0;

            // Adjust the size of the div to fit the block
            div.current.style.height = height + 2 * margin + "px";
            div.current.style.width = width + 2 * margin + "px";

            // workspace.zoomCenter(props.scale ?? 0.3);

            Blockly.svgResize(workspace);
        };

        const handleIntersection = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadBlock();
                    observer.current?.disconnect();
                }
            });
        };

        if (div.current) {
            observer.current = new IntersectionObserver(handleIntersection, {
                root: props.lazyLoadParentRef?.current || null,
                threshold: 0.1,
            });

            observer.current.observe(div.current);
        }

        return () => {
            observer.current?.disconnect();
            workspaceRef.current?.dispose();
            workspaceRef.current = null;
        };
    }, [props.state, props.lazyLoadParentRef, props.scale]);

    return (
        <div className={`${props.className} block-preview w-full flex flex-col items-center [&_.blocklySvg]:bg-transparent [&_.blocklyMainBackground]:stroke-none`}>
            <div ref={div}></div>
        </div>
    );
}
