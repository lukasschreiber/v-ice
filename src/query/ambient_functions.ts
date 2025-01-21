import { type DataRow, type IndexedDataRow } from "@/data/table";
import { DateTimeGranularityType } from "@/utils/datetime";

export function conditionalSplit(dataset: DataRow[], filterFn: (row: DataRow) => boolean): { positive: DataRow[], negative: DataRow[] } {
    const positive: DataRow[] = []
    const negative: DataRow[] = []

    for (const row of dataset) {
        if (filterFn(row)) {
            positive.push(row)
        } else {
            negative.push(row)
        }
    }

    return { positive, negative }

}

export function fib(n: number): number {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

export function merge(...args: IndexedDataRow[][]): IndexedDataRow[] {
    return args.reduce((acc, val) => {
        const result = [...acc]
        for (const row of val) {
            if (!result.find(r => r.index_ === row.index_)) {
                result.push(row)
            }
        }
        return result
    }, [])
}

export function count(set: IndexedDataRow[]): number {
    return set.length
}

export function setArithmetic(left: IndexedDataRow[], right: IndexedDataRow[], dataset: IndexedDataRow[], selection: string[]): IndexedDataRow[] {
    const leftSet = new Set(left.map(row => row.index_))
    const rightSet = new Set(right.map(row => row.index_))
    const result = new Set()

    if (selection.includes("INTERSECTION")) {
        for (const index of leftSet) {
            if (rightSet.has(index)) {
                result.add(index)
            }
        }
    }

    if (selection.includes("LEFT_EXCLUSIVE")) {
        for (const index of leftSet) {
            if (!rightSet.has(index)) {
                result.add(index)
            }
        }
    }

    if (selection.includes("RIGHT_EXCLUSIVE")) {
        for (const index of rightSet) {
            if (!leftSet.has(index)) {
                result.add(index)
            }
        }
    }

    if (selection.includes("NEITHER")) {
        for (const row of dataset) {
            if (!leftSet.has(row.index_) && !rightSet.has(row.index_)) {
                result.add(row.index_)
            }
        }
    }

    return Array.from(result).map(index => dataset.find(row => row.index_ === index)!)
}

export function sum(list: number[]): number {
    return list.reduce((a, b) => a + b, 0)
}

export function mean(list: number[]): number {
    return sum(list) / list.length
}

export function std(list: number[]): number {
    return Math.sqrt(list.reduce((a, b) => a + (b - mean(list)) ** 2, 0) / list.length)
}

export function quantile(list: number[], q: number): number {
    const sorted = list.slice().sort((a, b) => a - b)
    const pos = (sorted.length - 1) * q
    const base = Math.floor(pos)
    const rest = pos - base
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base])
    } else {
        return sorted[base]
    }
}

export function variance(list: number[]): number {
    return std(list) ** 2
}

export function mode(list: number[]): number {
    const counts = new Map<number, number>()
    for (const value of list) {
        counts.set(value, (counts.get(value) || 0) + 1)
    }

    let maxCount = 0
    let mode = 0
    for (const [value, count] of counts) {
        if (count > maxCount) {
            maxCount = count
            mode = value
        }
    }

    return mode
}

export function isPrime(n: number): boolean {
    if (n < 2) return false
    if (n === 2) return true
    if (n % 2 === 0) return false

    for (let i = 3; i <= Math.sqrt(n); i += 2) {
        if (n % i === 0) return false
    }

    return true
}

// TODO: which of the two is used???
export function subset(source: IndexedDataRow[], left: IndexedDataRow[], right: IndexedDataRow[], ops: string[]): IndexedDataRow[] {
    const leftExclusive: IndexedDataRow[] = []
    const rightExclusive: IndexedDataRow[] = []
    const intersection: IndexedDataRow[] = []
    const neither: IndexedDataRow[] = []

    for (const row of source) {
        if (left.includes(row) && right.includes(row)) {
            intersection.push(row)
        } else if (left.includes(row)) {
            leftExclusive.push(row)
        } else if (right.includes(row)) {
            rightExclusive.push(row)
        } else {
            neither.push(row)
        }
    }

    const result: IndexedDataRow[] = []

    if (ops.includes("INTERSECTION")) {
        result.push(...intersection)
    }

    if (ops.includes("LEFT_EXCLUSIVE")) {
        result.push(...leftExclusive)
    }

    if (ops.includes("RIGHT_EXCLUSIVE")) {
        result.push(...rightExclusive)
    }

    if (ops.includes("NEITHER")) {
        result.push(...neither)
    }

    return result
}

export function hierarchyEquals(left: string, right: string, hierarchyName: string) {
    const hierarchy = window.Blockly.typeRegistry.getHierarchy(hierarchyName)
    if (!hierarchy) return false
    const leftPath = hierarchy.getRoute(left)
    const rightPath = hierarchy.getRoute(right)

    // one part should be a subset of the other or they should be equal
    if (leftPath === null && rightPath === null) return true
    if (leftPath === null || rightPath === null) return false
    return rightPath.every((part, i) => part === leftPath[i])
}

export function maskDate(date: string, maskedComponents: DateTimeGranularityType[]): string {
    // the date string is in ISO format, so it is: yyyy-MM-ddThh:mm:ss.sssZ
    let dateTime = window.luxon.DateTime.fromISO(date)
    for (const component of maskedComponents) {
        dateTime = dateTime.set({ [component]: component === "month" || component === "day" ? 1 : 0 })
    }
    return dateTime.toFormat("yyyy-MM-dd'T'HH:mm:ss")
}

export function compareDates(op: "equals" | "after" | "before" | "after_or_equals" | "before_or_equals", a: { timestamp: string, masked?: DateTimeGranularityType[] } | string, b: { timestamp: string, masked?: DateTimeGranularityType[] } | string): boolean {
    if (typeof a === "string") a = { timestamp: a }
    if (typeof b === "string") b = { timestamp: b }

    let mask: DateTimeGranularityType[] = []
    if (a.masked && b.masked) {
        mask = Array.from(new Set(a.masked.concat(b.masked)))
    } else if (a.masked) {
        mask = a.masked
    } else if (b.masked) {
        mask = b.masked
    }

    if (op === "equals") {
        return maskDate(a.timestamp, mask) === maskDate(b.timestamp, mask)
    } else if (op === "after") {
        return maskDate(a.timestamp, mask) > maskDate(b.timestamp, mask)
    } else if (op === "before") {
        return maskDate(a.timestamp, mask) < maskDate(b.timestamp, mask)
    } else if (op === "after_or_equals") {
        return maskDate(a.timestamp, mask) >= maskDate(b.timestamp, mask)
    } else if (op === "before_or_equals") {
        return maskDate(a.timestamp, mask) <= maskDate(b.timestamp, mask)
    }

    return false
}

export function dateDiff(a: { timestamp: string, masked?: DateTimeGranularityType[] } | string, b: { timestamp: string, masked?: DateTimeGranularityType[] } | string): number {
    if (typeof a === "string") a = { timestamp: a }
    if (typeof b === "string") b = { timestamp: b }

    // get the unit as the smallest granularity not masked
    let unit: DateTimeGranularityType = "second"
    const mask = a.masked && b.masked ? Array.from(new Set(a.masked.concat(b.masked))) : a.masked || b.masked || []
    const units: DateTimeGranularityType[] = ["second", "minute", "hour", "day", "month", "year"]
    for (const component of units) {
        if (!mask.includes(component)) {
            unit = component as DateTimeGranularityType
            break
        }
    }

    const aDate = window.luxon.DateTime.fromISO(a.timestamp)
    const bDate = window.luxon.DateTime.fromISO(b.timestamp)

    return Math.abs(aDate.diff(bDate, unit).as(unit))
}