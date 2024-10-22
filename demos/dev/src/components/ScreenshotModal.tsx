import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, ModalBody, ModalHeader, ModalProps } from "../Modal";
import { Button } from "./Button";

export function ScreenshotModal(props: ModalProps & { selector?: string }) {
    const { open, onClose, selector, ...rest } = props;
    const screenshotSvg = useRef<SVGSVGElement | null>(null);
    const measurementIframe = useRef<HTMLIFrameElement | null>(null);
    const rightMask = useRef<HTMLDivElement | null>(null);
    const bottomMask = useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(0.8);
    const [bgColor, setBgColor] = useState("transparent");
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
    const [margin, setMargin] = useState(5);
    const [format, setFormat] = useState("svg");
    const [targetResolution, setTargetResolution] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const canvas = document
            .querySelector(selector ?? ".injectionDiv > .blocklySvg")
            ?.cloneNode(true) as SVGSVGElement | null;
        if (canvas === null || !screenshotSvg.current) return;
        screenshotSvg.current.childNodes.forEach((node) => node.remove());
        screenshotSvg.current.append(...Array.from(canvas.childNodes));
        const initialSize = {
            width: parseInt(canvas.getAttribute("width") ?? "0") * scale,
            height: parseInt(canvas.getAttribute("height") ?? "0") * scale,
        };
        screenshotSvg.current.setAttribute("width", initialSize.width.toString());
        screenshotSvg.current.setAttribute("height", initialSize.height.toString());
        setSize(initialSize);
        setInitialSize(initialSize);
        screenshotSvg.current.classList.add("blocklySvg");
        screenshotSvg.current.style.position = "relative";
        handleTransformations();
        autoCropAndCenter();
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        setTargetResolution({width: 1280, height: computeTargetResolutionHeight(1280)});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSize])

    const handleTransformations = useCallback(() => {
        if (!screenshotSvg.current) return;
        if (bottomMask.current && rightMask.current) {
            bottomMask.current.style.height = initialSize.height - size.height + "px";
            bottomMask.current.style.width = initialSize.width + "px";
            rightMask.current.style.width = initialSize.width - size.width + "px";
            rightMask.current.style.height = size.height + "px";
        }
        screenshotSvg.current.querySelectorAll(".blocklyBlockCanvas, .blocklyBubbleCanvas").forEach((canvas) => {
            canvas.setAttribute("transform", `translate(${position.x}, ${position.y}) scale(${scale})`);
            canvas.setAttribute("transform-origin", `0, 0`);
        });
        const bg = screenshotSvg.current.querySelector(".blocklyMainBackground");
        if (bg) {
            bg.setAttribute("style", `fill: ${bgColor} !important; stroke: none !important;`);
        }
    }, [scale, position, screenshotSvg, bgColor, size, initialSize]);

    useEffect(() => {
        handleTransformations();
    }, [handleTransformations]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "ArrowLeft") {
                setPosition((pos) => ({ ...pos, x: pos.x - 10 }));
            }
            if (e.key === "ArrowRight") {
                setPosition((pos) => ({ ...pos, x: pos.x + 10 }));
            }
            if (e.key === "ArrowUp") {
                setPosition((pos) => ({ ...pos, y: pos.y - 10 }));
            }
            if (e.key === "ArrowDown") {
                setPosition((pos) => ({ ...pos, y: pos.y + 10 }));
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    function getModifiedStyles(node: SVGElement) {
        if (!measurementIframe.current) return {};
        const referenceElement = measurementIframe.current.contentDocument!.createElement(node.tagName);
        measurementIframe.current.contentDocument?.body.appendChild(referenceElement);
        const defaultStyles = measurementIframe.current.contentWindow!.getComputedStyle(referenceElement);

        const styles = window.getComputedStyle(node);
        const modifiedStyles: Record<string, string> = {};
        for (let i = 0; i < styles.length; i++) {
            const key = styles[i];
            if (styles.getPropertyValue(key) !== defaultStyles.getPropertyValue(key)) {
                modifiedStyles[key] = styles.getPropertyValue(key);
            }
        }

        measurementIframe.current.contentDocument?.body.removeChild(referenceElement);

        return modifiedStyles;
    }

    function getInlineStyles(node: SVGElement) {
        const modifiedStyles = getModifiedStyles(node);
        return Object.entries(modifiedStyles)
            .map(([key, value]) => `${key}:${value}`)
            .join(";");
    }

    function inlineStyles(node: SVGElement) {
        // traverse the dom tree starting from node
        node.querySelectorAll("[class]").forEach((el) => {
            el.setAttribute("data-recover-style", el.getAttribute("style") ?? "");
            el.setAttribute("style", getInlineStyles(el as SVGElement) + ";" + (el.getAttribute("style") ?? ""));
        });
    }

    const autoCropAndCenter = useCallback(() => {
        const blockCanvas = screenshotSvg.current?.querySelector(".blocklyBlockCanvas") as SVGGElement | null;
        if (!blockCanvas) return;
        const bbox = blockCanvas.getBBox();
        const newWidth = bbox.width * scale + margin * 2;
        const newHeight = bbox.height * scale + margin * 2;
        const newPosX = -bbox.x * scale + margin;
        const newPosY = -bbox.y * scale + margin;
        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newPosX, y: newPosY });
    }, [scale, margin]);

    function handleDownload(url: string, filename: string) {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
    }

    function handleScreenshot() {
        if (!screenshotSvg.current) return;
        const root = screenshotSvg.current;
        root.setAttribute("width", size.width.toString());
        root.setAttribute("height", size.height.toString());
        inlineStyles(root);

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(root);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
        const svgUrl = URL.createObjectURL(svgBlob);

        if (format === "svg") {
            handleDownload(svgUrl, `screenshot.svg`);
            URL.revokeObjectURL(svgUrl);
        } else {
            // if format is not svg we need a canvas to rasterize the svg
            const canvas = document.createElement("canvas");
            canvas.width = targetResolution.width;
            canvas.height = targetResolution.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, targetResolution.width, targetResolution.height);
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, targetResolution.width, targetResolution.height);
                    const imgURI = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                    handleDownload(imgURI, `screenshot.png`);

                    URL.revokeObjectURL(svgUrl);
                };
                img.src = svgUrl;
            }
        }

        screenshotSvg.current.querySelectorAll("[data-recover-style]").forEach((el) => {
            el.setAttribute("style", el.getAttribute("data-recover-style") ?? "");
            el.removeAttribute("data-recover-style");
        });
        screenshotSvg.current.setAttribute("width", initialSize.width.toString());
        screenshotSvg.current.setAttribute("height", initialSize.height.toString());
    }

    const computeTargetResolutionHeight = useCallback((newWidth: number) => {
        return Math.round((newWidth / size.width) * size.height);
    }, [size]);

    useEffect(() => {
        setTargetResolution(oldResolution => ({ width: oldResolution.width, height: computeTargetResolutionHeight(oldResolution.width) }));
    }, [computeTargetResolutionHeight]);

    return (
        <Modal open={open} onClose={onClose} {...rest}>
            <ModalHeader>Take a screenshot</ModalHeader>
            <ModalBody>
                <div className="flex flex-row">
                    <div
                        className="renderer-renderer light-theme relative"
                        style={{
                            background: "repeating-conic-gradient(#eee 0% 25%, transparent 0% 50%) 50% / 20px 20px",
                            minWidth: initialSize.width.toString() + "px",
                            minHeight: initialSize.height.toString() + "px",
                        }}
                    >
                        <svg ref={screenshotSvg} style={{ background: "transparent" }} />
                        <div
                            ref={rightMask}
                            className="absolute top-0 right-0 bg-pink-500/20"
                            style={{ width: "0px" }}
                        />
                        <div
                            ref={bottomMask}
                            className="absolute bottom-0 left-0 bg-pink-500/20"
                            style={{ height: "0px" }}
                        />
                    </div>
                    <div className="px-2 flex flex-col gap-2">
                        <iframe ref={measurementIframe} className="hidden"></iframe>
                        <div className="flex flex-col">
                            <label>Background:</label>
                            <select
                                defaultValue={"transparent"}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="bg-white rounded-sm border-slate-300 border border-solid"
                            >
                                <option value={"white"}>White</option>
                                <option value={"transparent"}>Transparent</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label>Scale:</label>
                            <div className="flex flex-row gap-2 items-center">
                                <input
                                    type="range"
                                    min={0.1}
                                    max={2}
                                    step={0.01}
                                    value={scale}
                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                />
                                <div className="text-slate-400 text-xs">{Math.round(scale * 100)}%</div>
                            </div>
                            <div className="text-slate-400 text-xs">
                                The scale does not matter for an SVG, it is just for your convenience.
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label>Width:</label>
                            <div className="flex flex-row gap-2 items-center">
                                <input
                                    type="range"
                                    min={0}
                                    max={initialSize.width}
                                    step={1}
                                    value={size.width}
                                    onChange={(e) => setSize({ ...size, width: parseInt(e.target.value) })}
                                />
                                <div className="text-slate-400 text-xs">
                                    {Math.round((size.width / initialSize.width) * 100)}%
                                </div>
                            </div>
                            <div className="text-slate-400 text-xs">The width of the viewport.</div>
                        </div>
                        <div className="flex flex-col">
                            <label>Height:</label>
                            <div className="flex flex-row gap-2 items-center">
                                <input
                                    type="range"
                                    min={0}
                                    max={initialSize.height}
                                    step={1}
                                    value={size.height}
                                    onChange={(e) => setSize({ ...size, height: parseInt(e.target.value) })}
                                />
                                <div className="text-slate-400 text-xs">
                                    {Math.round((size.height / initialSize.height) * 100)}%
                                </div>
                            </div>
                            <div className="text-slate-400 text-xs">The height of the viewport.</div>
                        </div>
                        <div className="flex flex-col">
                            <label>Margin:</label>
                            <div className="flex flex-row gap-2 items-center">
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={margin}
                                    onChange={(e) => setMargin(parseInt(e.target.value))}
                                />
                                <div className="text-slate-400 text-xs">{margin}px</div>
                            </div>
                            <div className="text-slate-400 text-xs">
                                The margin that is used when auto cropping (default is 5px)
                            </div>
                        </div>
                        <div className="text-slate-400 text-xs">
                            Only the non-pink part of the preview is saved. You can move the underlying view using the
                            arrow keys.
                        </div>
                        <Button className="bg-slate-300 !text-slate-800" onClick={autoCropAndCenter}>
                            Auto crop and center
                        </Button>
                        <div className="flex flex-col">
                            <label>Format:</label>
                            <select
                                defaultValue={"svg"}
                                onChange={(e) => setFormat(e.target.value)}
                                className="bg-white rounded-sm border-slate-300 border border-solid"
                            >
                                <option value={"svg"}>SVG</option>
                                <option value={"png"}>PNG</option>
                            </select>
                        </div>
                        {format === "png" && <div className="flex flex-col gap-2">
                            <label>PNG Resolution:</label>
                            <select
                                defaultValue={1280}
                                onChange={(e) => setTargetResolution({ height: computeTargetResolutionHeight(parseInt(e.target.value)), width: parseInt(e.target.value) })}
                                className="bg-white rounded-sm border-slate-300 border border-solid"
                            >
                                <option value={426}>426px</option>
                                <option value={640}>720px</option>
                                <option value={854}>854px</option>
                                <option value={1280}>1280px</option>
                                <option value={1920}>1920px</option>
                                <option value={2560}>2560px</option>
                                <option value={3840}>3840px</option>
                            </select>
                            <div className="flex flex-row gap-2 items-center">
                                <input
                                    type="range"
                                    min={0}
                                    max={3840}
                                    step={1}
                                    value={targetResolution.width}
                                    onChange={(e) => setTargetResolution({ height: computeTargetResolutionHeight(parseInt(e.target.value)), width: parseInt(e.target.value) })}
                                />
                                <div className="text-slate-400 text-xs">
                                    {Math.round(targetResolution.width)}px
                                </div>
                            </div>
                            <div className="text-slate-400 text-xs">The width of the image in px. The image will have a resolution of {Math.round(targetResolution.width)}px x {Math.round(targetResolution.height)}px</div>
                        </div>}
                        <Button className="bg-slate-300 !text-slate-800" onClick={handleScreenshot}>
                            Download Screenshot
                        </Button>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
}
