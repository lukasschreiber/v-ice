import types, { IType } from "@/data/types";
import * as Blockly from "blockly/core"

export class IconFactory {
    static createIconForType(type: IType, color: string, secondaryColor: string = "white"): SVGGElement | null {
        let path: string = ""
        let secondaryPath: string = ""

        let fill = types.utils.isNullable(type) ? "none" : color
        if (types.utils.isTimeline(type)) {
            path = this.createTimelineIconPath()
        } else if (types.utils.isEvent(type)) {
            path = this.createEventIconPath()
        } else if (types.utils.isInterval(type)) {
            path = this.createIntervalIconPath()
        } else if (types.utils.isList(type)) {
            const listPath = this.createListIconPath(type.elementType)
            if (Array.isArray(listPath)) {
                path = listPath[0]
                secondaryPath = listPath[1]
            } else {
                path = listPath
            }
            if (types.utils.isNullable(type.elementType)) {
                fill = "none"
            }
        } else {
            const primitive = this.createPrimitivePath(type, 12, 0, 0)
            if (Array.isArray(primitive)) {
                path = primitive[0]
                secondaryPath = primitive[1]
            } else {
                path = primitive
            }
        }

        const group = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.G, {
            "class": "blocklyTypeIcon"
        })
        Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.PATH, {
            "d": path + "Z",
            "fill": fill,
            "stroke": color,
        }, group)

        if (secondaryPath) {
            Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.PATH, {
                "d": secondaryPath + "Z",
                "fill": fill,
                "stroke": fill === "none" ? color : secondaryColor,
            }, group)
        }

        return group
    }

    static createMinusIcon(color: string, size: number): SVGPathElement {
        return Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.PATH, {
            "d": this.createLinePath(0, 0, size, 0),
            "fill": "none",
            "stroke": color,
            "stroke-width": "2"
        })
    }

    static createPlusIcon(color: string, size: number): SVGPathElement {
        return Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.PATH, {
            "d": this.createLinePath(0, 0, size, 0) + this.createLinePath(size / 2, -size / 2, size / 2, size / 2),
            "fill": "none",
            "stroke": color,
            "stroke-width": "2"
        })
    }

    static wrapIcon(icon: SVGPathElement | SVGGElement): SVGSVGElement {
        const { width, height, x, y } = this.measurePath(icon)
        const svg = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.SVG, {
            "width": width,
            "height": height,
            "viewBox": `0 0 ${width} ${height}`
        })

        icon.setAttribute("transform", `translate(${-x} ${-y})`)
        svg.appendChild(icon)
        return svg
    }

    public static measurePath(path: SVGGElement): { x: number, y: number, width: number, height: number } {
        const svg = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.SVG, {})
        svg.appendChild(path)
        document.body.appendChild(svg)
        const bbox = path.getBBox();
        const strokeWidth = parseFloat(path.getAttribute("stroke-width") ?? "1") * 1.2; // I don't know why this is necessary, but it is, 1.2 is a magic number, it keeps the circle for numbers inside the bounds

        const adjustedBbox = {
            x: bbox.x - strokeWidth / 2,
            y: bbox.y - strokeWidth / 2,
            width: bbox.width + strokeWidth,
            height: bbox.height + strokeWidth
        };

        svg.remove()
        return adjustedBbox
    }

    protected static createLinePath(x1: number, y1: number, x2: number, y2: number): string {
        return Blockly.utils.svgPaths.moveTo(x1, y1) + Blockly.utils.svgPaths.lineTo(x2 - x1, y2 - y1)
    }

    protected static createPrimitivePath(type: IType, size: number, x: number, y: number): string | [string, string] {
        if (types.utils.isNumber(type)) {
            return this.createCirclePath(size / 2, x, y)
        } else if (types.utils.isBoolean(type)) {
            return this.createRhombusPath(size, size, x, y)
        } else if (types.utils.isString(type) || types.utils.isEnum(type)) {
            return this.createRectPath(size, size, x, y)
        } else if (types.utils.isHierarchy(type)) {
            return this.createTrapazoidPath(0, size, size, x, y)
        } else if (types.utils.isStruct(type)) {
            return this.createOctagonPath(size / 2, x, y)
        } else if (types.utils.isTimestamp(type)) {
            return this.createTimestampIconPath(size / 2, x, y)
        } else {
            return this.createStarPath(size / 4, size / 2, x, y)
        }
    }

    protected static createCirclePath(radius: number, cx: number, cy: number): string {
        return Blockly.utils.svgPaths.moveTo(cx, cy + radius)
            + Blockly.utils.svgPaths.arc("a", "0 1 1", radius, Blockly.utils.svgPaths.point(0, 1))
            + "Z"
    }

    protected static createRectPath(width: number, height: number, x: number, y: number): string {
        return Blockly.utils.svgPaths.moveTo(x, y)
            + Blockly.utils.svgPaths.lineOnAxis("h", width)
            + Blockly.utils.svgPaths.lineOnAxis("v", height)
            + Blockly.utils.svgPaths.lineOnAxis("h", -width)
            + Blockly.utils.svgPaths.lineOnAxis("v", -height)
            + "Z"
    }

    protected static createRhombusPath(width: number, height: number, x: number, y: number): string {
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        return Blockly.utils.svgPaths.moveTo(x + halfWidth, y)
            + Blockly.utils.svgPaths.lineTo(halfWidth, halfHeight)
            + Blockly.utils.svgPaths.lineTo(-halfWidth, halfHeight)
            + Blockly.utils.svgPaths.lineTo(-halfWidth, -halfHeight)
            + Blockly.utils.svgPaths.lineTo(halfWidth, -halfHeight)
            + "Z";
    }

    protected static createOctagonPath(radius: number, x: number, y: number): string {
        const thirdSize = radius * 2 / 3

        return Blockly.utils.svgPaths.moveTo(x + thirdSize, y)
            + Blockly.utils.svgPaths.lineTo(thirdSize, 0)
            + Blockly.utils.svgPaths.lineTo(thirdSize, thirdSize)
            + Blockly.utils.svgPaths.lineTo(0, thirdSize)
            + Blockly.utils.svgPaths.lineTo(-thirdSize, thirdSize)
            + Blockly.utils.svgPaths.lineTo(-thirdSize, 0)
            + Blockly.utils.svgPaths.lineTo(-thirdSize, -thirdSize)
            + Blockly.utils.svgPaths.lineTo(0, -thirdSize)
            + Blockly.utils.svgPaths.lineTo(thirdSize, -thirdSize)
            + "Z"
    }

    protected static createTrapazoidPath(topWidth: number, bottomWidth: number, height: number, x: number, y: number): string {
        const offsetX = (bottomWidth - topWidth) / 2
        return Blockly.utils.svgPaths.moveTo(x + offsetX, y)
            + Blockly.utils.svgPaths.lineTo(topWidth, 0)
            + Blockly.utils.svgPaths.lineTo(offsetX, height)
            + Blockly.utils.svgPaths.lineTo(-bottomWidth, 0)
            + Blockly.utils.svgPaths.lineTo(offsetX, -height)
            + "Z"
    }

    protected static createStarPath(innerRadius: number, outerRadius: number, cx: number, cy: number): string {
        const numPoints = 5;
        let points = '';
        cx = cx + outerRadius;
        cy = cy + outerRadius;
        points += `M ${cx},${cy - outerRadius} `;

        for (let i = 0; i <= numPoints * 2; i++) {
            const angle = (Math.PI / numPoints) * i - Math.PI / 2;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            points += `L ${x},${y} `;
        }

        return points + "Z"
    }

    protected static createListIconPath(elementType: IType): string | [string, string] {
        const padding = 3
        const elementSize = 8

        const iconTypes = types.utils.isWildcard(elementType) ?
            [types.number, types.enum(types.wildcard), types.boolean, types.wildcard] :
            [elementType, elementType, elementType, elementType]

        const paths = [
            this.createPrimitivePath(iconTypes[0], elementSize, 0, 0),
            this.createPrimitivePath(iconTypes[1], elementSize, 0, elementSize + padding),
            this.createPrimitivePath(iconTypes[2], elementSize, elementSize + padding, 0),
            this.createPrimitivePath(iconTypes[3], elementSize, elementSize + padding, elementSize + padding)
        ]

        return paths.every(p => !Array.isArray(p)) ? paths.join("") : [paths.map(it => it[0]).join(""), paths.map(it => it[1]).join("")]
    }

    protected static createTimelineIconPath(): string {
        const rowPadding = 3
        const rowWidth = 20
        const intervalHeight = 5
        const halfIntervalHeight = intervalHeight / 2
        const eventRadius = 2

        return Blockly.utils.svgPaths.moveTo(0, halfIntervalHeight)
            + Blockly.utils.svgPaths.lineOnAxis("h", rowWidth)
            + this.createRectPath(12, intervalHeight, 3, 0)
            + Blockly.utils.svgPaths.moveTo(0, intervalHeight + rowPadding + halfIntervalHeight)
            + Blockly.utils.svgPaths.lineOnAxis("h", rowWidth)
            + this.createCirclePath(eventRadius, 2, intervalHeight + rowPadding)
            + this.createRectPath(8, intervalHeight, 10, intervalHeight + rowPadding)
            + Blockly.utils.svgPaths.moveTo(0, 2 * (intervalHeight + rowPadding) + halfIntervalHeight)
            + Blockly.utils.svgPaths.lineOnAxis("h", rowWidth)
            + this.createCirclePath(eventRadius, 4, 2 * (intervalHeight + rowPadding))
            + this.createCirclePath(eventRadius, 12, 2 * (intervalHeight + rowPadding))
            + "Z"
    }

    protected static createDownArrowPath(x: number, y: number, length: number = 5, headWidth: number = 2): string {
        return Blockly.utils.svgPaths.moveTo(x, y)
            + Blockly.utils.svgPaths.lineOnAxis("v", length)
            + Blockly.utils.svgPaths.moveTo(x - headWidth, y + length - headWidth)
            + Blockly.utils.svgPaths.lineTo(headWidth, headWidth)
            + Blockly.utils.svgPaths.moveTo(x + headWidth, y + length - headWidth)
            + Blockly.utils.svgPaths.lineTo(-headWidth, headWidth)
            + "Z"
    }

    protected static createEventIconPath(): string {
        const rowWidth = 20
        const eventRadius = 3

        return this.createDownArrowPath(rowWidth / 2, 0, 8, 3)
            + Blockly.utils.svgPaths.moveTo(0, 13)
            + Blockly.utils.svgPaths.lineOnAxis("h", rowWidth)
            + this.createCirclePath(eventRadius, rowWidth / 2 - eventRadius, 13 - (eventRadius + 0.5))
            + "Z"
    }

    protected static createIntervalIconPath(): string {
        const rowWidth = 20
        const intervalHeight = 5
        const halfIntervalHeight = intervalHeight / 2

        return this.createDownArrowPath(rowWidth / 2, 0, 8, 3)
            + Blockly.utils.svgPaths.moveTo(0, 13)
            + Blockly.utils.svgPaths.lineOnAxis("h", rowWidth)
            + this.createRectPath(12, intervalHeight, 4, 13 - halfIntervalHeight)
            + "Z"
    }

    protected static createTimestampIconPath(radius = 8, x = 0, y = 0): [string, string] {
        const tickLength = radius * 0.75

        /**
         * Returns the coordinates of a point on the circle at the given angle. 0 degrees is at the top.
         * @param theta the angle in degrees
         * @returns the coordinates of the point
         */
        function getTickCoords(theta: number): [number, number] {
            const angle = (theta + 180) * Math.PI / 180
            const x = tickLength * Math.sin(angle)
            const y = tickLength * Math.cos(angle)
            return [x, y]
        }

        return [
            this.createCirclePath(radius, x, y),
            Blockly.utils.svgPaths.moveTo(radius + x, radius + y)
            + Blockly.utils.svgPaths.lineTo(...getTickCoords(0)) + "Z"
            + Blockly.utils.svgPaths.moveTo(radius + x, radius + y)
            + Blockly.utils.svgPaths.lineTo(...getTickCoords(-120)) + "Z"
        ]
    }
}