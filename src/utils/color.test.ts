import { expect, test } from "vitest"
import { Color, hex2rgba, hsla2rgba, rgba2hex, rgba2hsla } from "./color"

test("Test hex to rgba and rgba to hex", () => {
    const hexColors = Array.from({length: 100}, () => {
        return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")
    })

    const hexColorsAlpha = Array.from({length: 100}, () => {
        return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0") + Math.floor(Math.random() * 255).toString(16).padStart(2, "0")
    })

    hexColors.forEach(hex => {
        const rgba = rgba2hex(hex2rgba(hex))
        expect(rgba).toBe(hex + "ff")
    })

    hexColorsAlpha.forEach(hex => {
        const rgba = rgba2hex(hex2rgba(hex))
        expect(rgba).toBe(hex)
    })
})

test("Test rgba to hsla and hsla to rgba", () => {
    const rgbaColors = Array.from({length: 100}, () => {
        return [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)]
    })

    rgbaColors.forEach(rgba => {
        const hsla = rgba2hsla(rgba as Color)
        const rgba2 = hsla2rgba(hsla).map(x => x === -0 ? 0 : x)
        expect(rgba2).toEqual(rgba)
    })
})