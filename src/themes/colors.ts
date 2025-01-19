import colors from "./default.json"
import darkColors from "./default-dark.json"
import * as Blockly from "blockly/core"

type ColorsLike = { [key: string]: string | ColorsLike }

export type BlockColors = {
    bg: string,
    border: string,
    text: string,
    shadow: string
}

function hexToRgb(hex: string, seperator: string = " "): string {
    return hex.replace(/#/g, "").match(/.{1,2}/g)!.map(n => parseInt(n, 16).toString()).join(seperator)

}

function setColorVariables(colors: ColorsLike) {
    const stylesheet = document.createElement("style")
    stylesheet.innerHTML = `
    :root {
        ${Object.entries(flattenColorsLikeObject(colors)).map(([name, color]) => {
        return `--color-${name}: ${hexToRgb(color)};`
    }).join("\n")}
    }`

    document.body.appendChild(stylesheet)
}


function flattenColorsLikeObject(obj: ColorsLike) {
    const res: Record<string, string> = {};

    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        if ((typeof obj[key]) === 'object' && obj[key] !== null) {
            const flattened = flattenColorsLikeObject(obj[key] as ColorsLike);
            for (const x in flattened) {
                if (!Object.prototype.hasOwnProperty.call(flattened, x)) continue;

                res[key + '-' + x] = flattened[x];
            }
        } else {
            res[key] = obj[key] as string;
        }
    }
    return res;
}

export const DefaultColors = colors.colors

// Todo: Not really nice to have to enumerate themes here
export function getColor(color: ValidColorKeys<typeof DefaultColors, "-">, alpha: number = 1.0): string {
    return `rgb(var(--color-${color}) / ${alpha})`
}

export function getColorsForBlockStyle(style: string): BlockColors {
    function getColorsForCategory(category: string): BlockColors {
        return {
            bg: getColor(`categories-${category}-bg` as ValidColorKeys<typeof DefaultColors, "-">),
            border: getColor(`categories-${category}-border` as ValidColorKeys<typeof DefaultColors, "-">),
            text: getColor(`categories-${category}-text` as ValidColorKeys<typeof DefaultColors, "-">),
            shadow: getColor(`categories-${category}-shadow` as ValidColorKeys<typeof DefaultColors, "-">)
        }
    }

    if (style === "variable_blocks") return getColorsForCategory("variables")
    if (style === "comparisons_blocks") return getColorsForCategory("comparisons")
    if (style === "node_blocks") return getColorsForCategory("nodes")
    if (style === "capped_node_blocks") return getColorsForCategory("nodes")
    if (style === "timeline_blocks") return getColorsForCategory("timeline")
    if (style === "logic_blocks") return getColorsForCategory("logic")
    if (style === "list_blocks") return getColorsForCategory("lists")
    if (style === "math_blocks") return getColorsForCategory("math")
    return getColorsForCategory("nodes")
}

// a type that gets all valid keys for example colors.categories.comparisons
type ValidColorKeys<T extends ColorsLike, Delimiter extends string, P extends string = ''> =
    T extends string
    ? P
    : {
        [K in Extract<keyof T, string>]: T[K] extends ColorsLike
        ? ValidColorKeys<T[K], Delimiter, P extends '' ? K : `${P}${Delimiter}${K}`>
        : P extends '' ? K : `${P}${Delimiter}${K}`;
    }[Extract<keyof T, string>];

export function setTheme(workspace: Blockly.WorkspaceSvg, theme: Blockly.Theme) {
    workspace.setTheme(theme)
    if (theme.name === "dark") {
        setColorVariables(darkColors.colors)
    } else {
        setColorVariables(colors.colors)
    }

    workspace.render()
}