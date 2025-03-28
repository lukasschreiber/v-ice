import { useHelp } from "@/context/manual/manual_hooks";
import { InvariantMarkdownView } from "./common/MarkdownView";
// import { getHelpMarkdown } from "@/i18n";
import { useTranslation } from "react-i18next";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { showHelp } from "@/context/manual/manual_emitter";
import ChevronRightIcon from "@/assets/ChevronRightIcon.svg?react";
import { createPortal } from "react-dom";
import { getManualMarkdown } from "@/context/manual/manual_loader";
import { Layer } from "@/utils/zindex";

interface BreadCrumb {
    text: string;
    href: string;
}

export function ManualPage(props: {externalWindowRef?: React.RefObject<WindowProxy>}) {
    const { i18n } = useTranslation();
    const { activePage, setActivePage } = useHelp();
    const [hoveredBreadCrumbElement, setHoveredBreadCrumbElement] = useState<HTMLElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const breadCrumbContainerRef = useRef<HTMLDivElement>(null);
    const [breadCrumbs, setBreadCrumbs] = useState<BreadCrumb[]>([]);
    
    const helpMarkdown = useMemo(() => getManualMarkdown(i18n.language), [i18n.language]);

    const doc = props.externalWindowRef?.current?.document ?? document;

    useEffect(() => {
        if (activePage) {
            const element = doc.getElementById(activePage.slice(1));
            if (element) {
                element.scrollIntoView({ behavior: "instant" });
            }
        }
    }, [activePage]);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        // scroll listener for markdown view
        const scrollListener = () => {
            const breadCrumbs: BreadCrumb[] = [];
            if (scrollContainerRef.current) {
                const scrollPos = scrollContainerRef.current.scrollTop;
                const headings = scrollContainerRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
                const headingsPathMap = new Map<string, HTMLElement>();
                const indexPathMap = new Map<string, number>();
                for (let i = 0; i < headings.length; i++) {
                    const heading = headings[i] as HTMLElement;
                    if (heading.offsetTop > scrollPos + 100) {
                        break;
                    }
                    indexPathMap.set(heading.tagName, i);
                    headingsPathMap.set(heading.tagName, heading);
                }

                let lastIndex = 0;
                for (const [tagName, heading] of headingsPathMap) {
                    const index = indexPathMap.get(tagName)!;

                    if (index < lastIndex) {
                        continue;
                    }

                    const text = Array.from(heading.childNodes)
                        .map((node) => {
                            if (node.nodeType === Node.TEXT_NODE) {
                                return node.textContent;
                            } else {
                                return "";
                            }
                        })
                        .join("");

                    if (!heading.querySelector("a[id]")) {
                        const anchor = doc.createElement("a");
                        anchor.id = text.toLowerCase().replace(/\s/g, "-") ?? "";
                        heading.appendChild(anchor);
                    }

                    const href = `#${heading.querySelector("a[id]")!.id}`;
                    const headingText = text;
                    if (headingText) {
                        breadCrumbs.push({ text: headingText, href });
                    }

                    lastIndex = index;
                }
            }

            setActivePage(null);
            setBreadCrumbs(breadCrumbs);
        };

        scrollListener();

        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", scrollListener);
        }

        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener("scroll", scrollListener);
            }
        };
    }, []);

    return (
        <>
            <div className="shadow-md p-2 flex flex-row gap-1 items-center" ref={breadCrumbContainerRef}>
                {breadCrumbs.map((breadCrumb, index) => {
                    return (
                        <Fragment key={index}>
                            <div
                                onMouseEnter={(e) => setHoveredBreadCrumbElement(e.currentTarget)}
                                onMouseLeave={() => setHoveredBreadCrumbElement(null)}
                                onClick={() => showHelp(breadCrumb.href)}
                                className="hover:!underline !text-blue-500 cursor-pointer whitespace-nowrap overflow-hidden overflow-ellipsis inline-block shrink"
                            >
                                {breadCrumb.text}
                            </div>
                            <div>
                                {index < breadCrumbs.length - 1 && (
                                    <span>
                                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                    </span>
                                )}
                            </div>
                        </Fragment>
                    );
                })}
            </div>
            <div className="p-2 overflow-auto overflow-x-hidden" id="help-start" ref={scrollContainerRef}>
                <InvariantMarkdownView markdown={helpMarkdown} externalWindowRef={props.externalWindowRef} />
            </div>
            
            {hoveredBreadCrumbElement &&
                hoveredBreadCrumbElement.offsetWidth !== hoveredBreadCrumbElement.scrollWidth &&
                createPortal(
                    <div
                        className="absolute bg-white border border-gray-200 shadow-lg rounded-md px-1"
                        style={{
                            zIndex: Layer.Tooltips,
                            top: `${
                                hoveredBreadCrumbElement.getBoundingClientRect().top +
                                hoveredBreadCrumbElement.getBoundingClientRect().height
                            }px`,
                            left: `${hoveredBreadCrumbElement.getBoundingClientRect().left}px`,
                        }}
                    >
                        {hoveredBreadCrumbElement.textContent}
                    </div>,
                    doc.body
                )}
        </>
    );
}
