import Markdown from "react-markdown";
import gfm from "remark-gfm";
import "github-markdown-css/github-markdown-light.css";
import { MediaView } from "./MediaView";
import directive from "remark-directive";
import { visit } from "unist-util-visit";
import { BlockPreview } from "./BlockPreview";
import { TypeIconPreview } from "./TypeIconPreview";
import { BlockInlinePreview } from "./BlockInlinePreview";
import { GenericBlockDefinition } from "@/blocks/toolbox/toolbox_definition";
import React, { HTMLProps, memo } from "react";
import { showHelp } from "@/context/manual/manual_emitter";
import { InfoBox, InfoBoxType } from "./InfoBox";
import { BlockInfoWidget } from "./BlockInfoWidget";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            blockpreview: {data: {block: GenericBlockDefinition}}
            typeicon: {data: {type: string}}
            inlineblockpreview: {data: {block: GenericBlockDefinition, text: string}}
            anchor: {id: string}
            infobox: {data: {type: InfoBoxType}}
            blockinfowidget: {data: {type: string}}
        }
    }
}

interface MarkdownViewProps extends HTMLProps<HTMLDivElement> {
    markdown: string;
}

export function MarkdownView(props: MarkdownViewProps) {
    const markdownContainerRef = React.useRef<HTMLDivElement>(null);
    return (
        <Markdown
            remarkPlugins={[gfm, directive, blockPreviewDirective, typeIconDirective, inlineBlockPreviewDirective, anchorDirective, infoBoxDirective, blockInfoWidgetDirective]}
            className={"markdown-body px-2 !bg-transparent"}
            components={{ 
                /* eslint-disable @typescript-eslint/no-unused-vars */
                img: ({ node, ...props }) => <MediaView {...props} />,
                a: ({ node, href, ...props }) => {
                    if (href?.startsWith("#")) {
                        return <a {...props} onClick={() => showHelp(href)} className="hover:!underline !text-[#0969da] cursor-pointer" />
                    }
                    return <a {...props} href={href}/>
                },
                blockpreview: ({ data }) => {
                    return <BlockPreview block={data.block} lazyLoadParentRef={markdownContainerRef} />
                },
                typeicon: ({ data }) => {
                    return <TypeIconPreview type={data.type} />
                },
                inlineblockpreview: ({ data }) => {
                    return <BlockInlinePreview text={data.text} block={data.block} />
                },
                anchor: ({ node, ...props }) => {
                    return <a id={props.id}></a>
                },
                infobox: ({ node, data, ...props }) => {
                    return <InfoBox type={data.type} {...props} />
                },
                blockinfowidget: ({ data }) => {
                    return <BlockInfoWidget type={data.type} />
                },
                /* eslint-enable @typescript-eslint/no-unused-vars */
            }}
        >
            {props.markdown}
        </Markdown>
    );
}

export const InvariantMarkdownView: React.FC<MarkdownViewProps> = memo(({markdown}) => {
    return <MarkdownView markdown={markdown} />
});

function anchorDirective() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tree: any) => {
        visit(tree, ['textDirective', 'leafDirective', 'containerDirective'], (node) => {
            if (node.name === 'anchor') {
                const data = node.attributes || {};
                node.type = 'anchor';
                node.data = {hName: 'anchor', hProperties: {id: data.id}};
            }
        });
    };

}

function blockPreviewDirective() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tree: any) => {
        visit(tree, ['textDirective', 'leafDirective', 'containerDirective'], (node) => {
            if (node.name === 'block-preview') {
                const data = node.attributes || {};
                // Ensure fields and inputs are parsed as JSON if they are strings
                if (typeof data.block === 'string') {
                    try {
                        data.block = JSON.parse(data.block.replace(/'/g, '"'));
                    } catch (e) {
                        console.error('Invalid JSON for block', e);
                    }
                }
                node.type = 'block-preview';
                node.data = { hName: 'blockpreview', hProperties: { data } };
            }
        });
    };
}

function inlineBlockPreviewDirective() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tree: any) => {
        visit(tree, ['textDirective', 'leafDirective', 'containerDirective'], (node) => {
            if (node.name === 'inline-block-preview') {
                const data = node.attributes || {};
                // Ensure fields and inputs are parsed as JSON if they are strings
                if (typeof data.block === 'string') {
                    try {
                        data.block = JSON.parse(data.block.replace(/'/g, '"'));
                    } catch (e) {
                        console.error('Invalid JSON for block', e);
                    }
                }
                node.type = 'inline-block-preview';
                node.data = { hName: 'inlineblockpreview', hProperties: { data } };
            }
        });
    };
}

function typeIconDirective() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tree: any) => {
        visit(tree, ['textDirective', 'leafDirective', 'containerDirective'], (node) => {
            if (node.name === 'type-icon') {
                const data = node.attributes || {};
                node.type = 'type-icon';
                node.data = { hName: 'typeicon', hProperties: { data } };
            }
        });
    };
}

function infoBoxDirective() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tree: any) => {
        visit(tree, ['textDirective', 'leafDirective', 'containerDirective'], (node) => {
            if (node.name === 'info-box') {
                const data = node.attributes || {};
                node.type = 'infobox';
                node.data = { hName: 'infobox', hProperties: { data } };
            }
        });
    };
}

function blockInfoWidgetDirective() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tree: any) => {
        visit(tree, ['textDirective', 'leafDirective', 'containerDirective'], (node) => {
            if (node.name === 'blockinfo') {
                const data = node.attributes || {};
                node.type = 'blockinfowidget';
                node.data = { hName: 'blockinfowidget', hProperties: { data } };
            }
        });
    };
}