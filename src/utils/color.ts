export type Color = [number, number, number, number]

export function hex2rgba(hex: string): Color {
    if (hex.length === 7 || hex.length === 9) {
        hex = hex.slice(1)
    }
    if (hex.length !== 6 && hex.length !== 8) {
        throw new Error('Invalid hex color')
    }

    if (hex.length === 6) {
        return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16),
            255
        ]
    }

    return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        parseInt(hex.slice(6, 8), 16),
    ]
}

export function rgba2hex(rgba: Color): string {
    return `#${rgba.slice(0, 4).map(c => c.toString(16).padStart(2, '0')).join('')}`
}

export function hsla2rgba(color: Color): Color {
    const h = color[0] / 360;
    const s = color[1];
    const l = color[2];
    const a = color[3];

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 1 / 6) {
        r = c; g = x; b = 0;
    } else if (1 / 6 <= h && h < 1 / 3) {
        r = x; g = c; b = 0;
    } else if (1 / 3 <= h && h < 1 / 2) {
        r = 0; g = c; b = x;
    } else if (1 / 2 <= h && h < 2 / 3) {
        r = 0; g = x; b = c;
    } else if (2 / 3 <= h && h < 5 / 6) {
        r = x; g = 0; b = c;
    } else if (5 / 6 <= h && h < 1) {
        r = c; g = 0; b = x;
    }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
        a,
    ];
}

export function rgba2hsla(color: Color): Color {
    const r = color[0] / 255;
    const g = color[1] / 255;
    const b = color[2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    const c = max - min;
    const l = (max + min) / 2;

    let h = 0;
    if (c === 0) return [0, 0, l, color[3]];
    else if (max === r) h = (g - b) / c + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / c + 2;
    else if (max === b) h = (r - g) / c + 4;
    h = h / 6;

    const s = l === 0 || l === 1 ? 0 : c / (1 - Math.abs(2 * max - c - 1));

    return [h * 360, s, l, color[3]];
}

export function lighten(hex: string, amount: number): string {
    const color = hex2rgba(hex)
    const hsl = rgba2hsla(color)
    hsl[2] += amount
    return rgba2hex(hsla2rgba(hsl))
}

export function darken(hex: string, amount: number): string {
    return lighten(hex, -amount)
}

export function isTooLight(hex: string): boolean {
    const color = hex2rgba(hex)
    const hsl = rgba2hsla(color)
    return hsl[2] > 0.8
}