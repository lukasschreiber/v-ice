import colors from "./default.json"
export const Colors = colors.colors

type ColorsLike = {[key: string]: string | ColorsLike}

function hexToRgb(hex: string, seperator: string = " "): string {
    return hex.replace(/#/g, "").match(/.{1,2}/g)!.map(n => parseInt(n, 16).toString()).join(seperator)

}

function setColorVariables() {
    const stylesheet = document.createElement("style")
    stylesheet.innerHTML = `
    :root {
        ${Object.entries(flattenColorsLikeObject(Colors)).map(([name, color]) => {
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

setColorVariables()
