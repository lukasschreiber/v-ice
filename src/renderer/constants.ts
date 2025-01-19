import { ConnectionType } from "@/blocks/block_definitions";
import types, { IType } from "@/data/types";
import * as Blockly from "blockly/core"
import { Shape } from "blockly/core/renderers/common/constants";

export class ConstantProvider extends Blockly.zelos.ConstantProvider {
    private customDisabledPattern: SVGElement | null = null
    private customDefs: SVGElement | null = null

    // TODO: font size and font family should be set here

    override TOP_ROW_MIN_HEIGHT = 4;
    override BOTTOM_ROW_MIN_HEIGHT = 4;

    // the padding between inputs and texts
    override MEDIUM_PADDING = 8;

    // Replacement glow in white and a bit larger.
    // Selected glow is invisible as it is distracting.
    override SELECTED_GLOW_COLOUR = "#ffffffaa";
    override SELECTED_GLOW_SIZE = 0.5;
    override REPLACEMENT_GLOW_COLOUR = "#ffffffaa"; // could be transparent
    override REPLACEMENT_GLOW_SIZE = 2;

    override START_HAT_HEIGHT = 40;
    override START_HAT_WIDTH = 170;

    override EMPTY_INLINE_INPUT_HEIGHT = 32
    override EMPTY_INLINE_INPUT_PADDING = 7

    EMPTY_INLINE_INPUT_MIN_WIDTH = 39 // 32 + 7

    override SHAPES = { HEXAGONAL: 1, ROUND: 2, SQUARE: 3, PUZZLE: 4, NOTCH: 5, TRIANGULAR_NOTCH: 6, OCTOGONAL: 7 }

    TRIANGULAR_NOTCH: Shape | null = null

    OCTAGONAL: Shape | null = null

    override init() {
        super.init()
        this.TRIANGULAR_NOTCH = this.makeTriangularNotch()
        this.OCTAGONAL = this.makeOctagonal()
    }

    override SHAPE_IN_SHAPE_PADDING: { [key: number]: { [key: number]: number } } = {
        1: {
            // Outer shape: hexagon.
            0: 5 * this.GRID_UNIT, // Field in hexagon.
            1: 2 * this.GRID_UNIT, // Hexagon in hexagon.
            2: 5 * this.GRID_UNIT, // Round in hexagon.
            3: 5 * this.GRID_UNIT, // Square in hexagon.
            7: 5 * this.GRID_UNIT, // Octagon in hexagon.
        },
        2: {
            // Outer shape: round.
            0: 3 * this.GRID_UNIT, // Field in round.
            1: 3 * this.GRID_UNIT, // Hexagon in round.
            2: 1 * this.GRID_UNIT, // Round in round.
            3: 2 * this.GRID_UNIT, // Square in round.
            7: 2 * this.GRID_UNIT, // Octagon in round.
        },
        3: {
            // Outer shape: square.
            0: 2 * this.GRID_UNIT, // Field in square.
            1: 2 * this.GRID_UNIT, // Hexagon in square.
            2: 2 * this.GRID_UNIT, // Round in square.
            3: 2 * this.GRID_UNIT, // Square in square.
            7: 2 * this.GRID_UNIT, // Octagon in square.
        },
        7: {
            // Outer shape: octagon.
            0: 3 * this.GRID_UNIT, // Field in octagon.
            1: 3 * this.GRID_UNIT, // Hexagon in octagon.
            2: 1 * this.GRID_UNIT, // Round in octagon.
            3: 2 * this.GRID_UNIT, // Square in octagon.
            7: 1 * this.GRID_UNIT, // Octagon in octagon.
        }
    };

    // TODO: override createDom to inject custom disabled pattern

    override makeStartHat(): { height: number; width: number; path: string; } {
        const height = this.START_HAT_HEIGHT;
        const width = this.START_HAT_WIDTH;

        const mainPath = Blockly.utils.svgPaths.curve('c', [
            Blockly.utils.svgPaths.point(25, -height),
            Blockly.utils.svgPaths.point(width - height - 3, -height),
            Blockly.utils.svgPaths.point(width, 0),
        ]);
        return { height, width, path: mainPath };
    }

    public shapeForType(type: IType): Shape {
        if (types.utils.isList(type)) {
            return this.shapeForType(type.elementType);
        }

        if (types.utils.isUnion(type)) {
            // we do a majority vote on the types
            const typeCounts: { [key: string]: number } = {}
            for (const t of type.types) {
                const typeName = t.name
                if (typeCounts[typeName] === undefined) {
                    typeCounts[typeName] = 0
                }
                typeCounts[typeName]++
            }

            let maxType = ""
            let maxCount = 0
            for (const typeName in typeCounts) {
                if (typeCounts[typeName] > maxCount) {
                    maxCount = typeCounts[typeName]
                    maxType = typeName
                }
            }

            return this.shapeForType(types.utils.fromString(maxType))
        }

        if (types.utils.isBoolean(type)) {
            return this.HEXAGONAL!;
        }

        if (types.utils.isEnum(type) || types.utils.isHierarchy(type) || types.utils.isString(type)) {
            return this.SQUARED!;
        }

        if (types.utils.isStruct(type)) {
            return this.OCTAGONAL!;
        }

        return this.ROUNDED!;
    }

    override shapeFor(connection: Blockly.RenderedConnection): Shape {
        let check = connection.getCheck()?.[0];
        if (!check && connection.targetConnection) {
            check = connection.targetConnection.getCheck()?.[0];
        }

        let outputShape;
        switch (connection.type) {
            case Blockly.ConnectionType.INPUT_VALUE:
            case Blockly.ConnectionType.OUTPUT_VALUE:
                outputShape = connection.getSourceBlock().getOutputShape();
                // If the block has an output shape set, use that instead.
                if (outputShape !== null) {
                    switch (outputShape) {
                        case this.SHAPES.HEXAGONAL:
                            return this.HEXAGONAL!;
                        case this.SHAPES.ROUND:
                            return this.ROUNDED!;
                        case this.SHAPES.SQUARE:
                            return this.SQUARED!;
                    }
                }

                if (check) {
                    const type = types.utils.fromString(check);
                    return this.shapeForType(type);
                }
                return this.ROUNDED!;
            case Blockly.ConnectionType.PREVIOUS_STATEMENT:
            case Blockly.ConnectionType.NEXT_STATEMENT:
                switch (check) {
                    case ConnectionType.TIMELINE_PROTOTYPE:
                        return this.TRIANGULAR_NOTCH!;
                    default:
                        return this.NOTCH!;
                }
            default:
                throw Error('Unknown type');
        }
    }

    makeTriangularNotch() {
        const width = this.NOTCH_WIDTH;
        const height = this.NOTCH_HEIGHT;
        const innerWidth = 3;
        const outerWidth = (width - innerWidth) / 2;

        /**
         * Make the main path for the notch.
         *
         * @param dir Direction multiplier to apply to horizontal offsets along the
         *     path. Either 1 or -1.
         * @returns A path fragment describing a notch.
         */
        function makeMainPath(dir: number): string {
            return Blockly.utils.svgPaths.line([
                Blockly.utils.svgPaths.point(dir * outerWidth, height),
                Blockly.utils.svgPaths.point(dir * innerWidth, 0),
                Blockly.utils.svgPaths.point(dir * outerWidth, -height),
            ]);
        }
        const pathLeft = makeMainPath(1);
        const pathRight = makeMainPath(-1);

        return {
            type: this.SHAPES.TRIANGULAR_NOTCH,
            width,
            height,
            pathLeft,
            pathRight,
        };
    }

    makeOctagonal(): Shape {
        const maxWidth = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;

        function makeMainPath(height: number, up: boolean, right: boolean): string {
            const halfHeight = height / 2;
            const quarterHeight = halfHeight / 2;
            const thirdHeight = height / 3;
            const width = thirdHeight > maxWidth ? maxWidth : thirdHeight;
            const forward = up ? -1 : 1;
            const direction = right ? -1 : 1;
            return (
                Blockly.utils.svgPaths.lineTo(-direction * width, (forward * quarterHeight)) +
                Blockly.utils.svgPaths.lineTo(0, forward * halfHeight) +
                Blockly.utils.svgPaths.lineTo(direction * width, (forward * quarterHeight))
            );
        }

        return {
            type: this.SHAPES.OCTOGONAL,
            isDynamic: true,
            width(height: number): number {
                const thirdHeight = height / 3;
                return thirdHeight > maxWidth ? maxWidth : thirdHeight;
            },
            height(height: number): number {
                return height;
            },
            connectionOffsetY(connectionHeight: number): number {
                return connectionHeight / 2;
            },
            connectionOffsetX(connectionWidth: number): number {
                return -connectionWidth;
            },
            pathDown(height: number): string {
                return makeMainPath(height, false, false);
            },
            pathUp(height: number): string {
                return makeMainPath(height, true, false);
            },
            pathRightDown(height: number): string {
                return makeMainPath(height, false, true);
            },
            pathRightUp(height: number): string {
                return makeMainPath(height, false, true);
            },
        };
    }

    createDom(svg: SVGElement, tagName: string, selector: string): void {
        super.createDom(svg, tagName, selector)

        this.customDefs = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.DEFS, {}, svg)

        const disabledPattern = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.PATTERN,
            {
                'id': 'blocklyCustomDisabledPattern' + this.randomIdentifier,
                'patternUnits': 'userSpaceOnUse',
                'width': 10,
                'height': 10,
            },
            this.customDefs,
        );
        Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.RECT,
            { 'width': 10, 'height': 10, 'fill': '#aaaaaa' },
            disabledPattern,
        );
        Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.PATH,
            { 'd': 'M 10 0 L 0 10', 'stroke': '#555555' }, // M 0 0 L 10 10 M 10 0 L 0 10
            disabledPattern,
        );
        this.disabledPatternId = disabledPattern.id;
        this.customDisabledPattern = disabledPattern;
    }

    dispose(): void {
        super.dispose()
        if (this.customDisabledPattern) {
            Blockly.utils.dom.removeNode(this.customDisabledPattern)
        }
    }

    // we have to override this method to use our custom disabled pattern
    override getCSS_(selector: string) {
        return [
            /* eslint-disable indent */
            // Text.
            `${selector} .blocklyText,`,
            `${selector} .blocklyFlyoutLabelText {`,
            `font: ${this.FIELD_TEXT_FONTWEIGHT} ${this.FIELD_TEXT_FONTSIZE}` +
            `pt ${this.FIELD_TEXT_FONTFAMILY};`,
            `}`,

            `${selector} .blocklyTextInputBubble textarea {`,
            `font-weight: normal;`,
            `}`,

            // Fields.
            `${selector} .blocklyText {`,
            `fill: #fff;`,
            `}`,
            `${selector} .blocklyNonEditableText>rect:not(.blocklyDropdownRect),`,
            `${selector} .blocklyEditableText>rect:not(.blocklyDropdownRect) {`,
            `fill: ${this.FIELD_BORDER_RECT_COLOUR};`,
            `}`,
            `${selector} .blocklyNonEditableText>text,`,
            `${selector} .blocklyEditableText>text,`,
            `${selector} .blocklyNonEditableText>g>text,`,
            `${selector} .blocklyEditableText>g>text {`,
            `fill: #575E75;`,
            `}`,

            // Flyout labels.
            `${selector} .blocklyFlyoutLabelText {`,
            `fill: #575E75;`,
            `}`,

            // Bubbles.
            `${selector} .blocklyText.blocklyBubbleText {`,
            `fill: #575E75;`,
            `}`,

            // Editable field hover.
            `${selector} .blocklyDraggable:not(.blocklyDisabled)`,
            ` .blocklyEditableText:not(.editing):hover>rect,`,
            `${selector} .blocklyDraggable:not(.blocklyDisabled)`,
            ` .blocklyEditableText:not(.editing):hover>.blocklyPath {`,
            `stroke: #fff;`,
            `stroke-width: 2;`,
            `}`,

            // Text field input.
            `${selector} .blocklyHtmlInput {`,
            `font-family: ${this.FIELD_TEXT_FONTFAMILY};`,
            `font-weight: ${this.FIELD_TEXT_FONTWEIGHT};`,
            `color: #575E75;`,
            `}`,

            // Dropdown field.
            // `${selector} .blocklyDropdownText {`,
            // `fill: #fff !important;`,
            // `}`,

            // Widget and Dropdown Div
            `${selector}.blocklyWidgetDiv .goog-menuitem,`,
            `${selector}.blocklyDropDownDiv .goog-menuitem {`,
            `font-family: ${this.FIELD_TEXT_FONTFAMILY};`,
            `}`,
            `${selector}.blocklyDropDownDiv .goog-menuitem-content {`,
            `color: #fff;`,
            `}`,

            // Connection highlight.
            `${selector} .blocklyHighlightedConnectionPath {`,
            `stroke: ${this.SELECTED_GLOW_COLOUR};`,
            `}`,

            // Disabled outline paths.
            `${selector} .blocklyDisabled > .blocklyOutlinePath {`,
            `fill: url(#blocklyCustomDisabledPattern${this.randomIdentifier});`,
            `}`,

            // type icons in disabled blocks
            `${selector} .blocklyDisabled .blocklyTypeIcon {`,
            `stroke: #555;`,
            `}`,
            `${selector} .blocklyDisabled .blocklyTypeIcon:not([fill="none"]) {`,
            `fill: #555;`,
            `}`,

            // Insertion marker.
            `${selector} .blocklyInsertionMarker>.blocklyPath {`,
            `fill-opacity: ${this.INSERTION_MARKER_OPACITY};`,
            `stroke: none;`,
            `}`,
        ];
    }
}
