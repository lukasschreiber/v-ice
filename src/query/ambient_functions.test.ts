import { expect, test } from "vitest"
import ambientRaw from "@/query/ambient_functions?raw"
import * as ambient from "@/query/ambient_functions"
import ts from "typescript"
import "@/window"

test("ambient functions are defined and all exports are actually functions with unique names", () => {
    Object.entries(ambient).forEach(([name, fn]) => {
        expect(typeof fn).toBe("function")
        expect(fn.name).toBe(name)
    })

    const names = Object.keys(ambient)
    expect(new Set(names).size).toBe(names.length)
})

test("ambient functions do not have any dependencies", async () => {
    const output = ts.transpileModule(ambientRaw, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ESNext
        }
    })

    const source = output.outputText
    const dependencies = source.match(/^import\w|^require/gm)
    expect(dependencies).toBe(null)
})

test("conditionalSplit function works correctly", () => {
    const dataset = [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }]
    const result = ambient.conditionalSplit(dataset, row => (row.a as number) % 2 === 0)
    expect(result.positive).toEqual([{ a: 2 }, { a: 4 }])
    expect(result.negative).toEqual([{ a: 1 }, { a: 3 }])
})

test("merge function works correctly", () => {
    const a = [{ index_: 1, a: 1 }, { index_: 2, a: 2 }]
    const b = [{ index_: 2, a: 2 }, { index_: 3, a: 3 }]
    const result = ambient.merge(a, b)

    expect(result).toEqual([{ index_: 1, a: 1 }, { index_: 2, a: 2 }, { index_: 3, a: 3 }])
})

test("median function works correctly", () => {
    expect(ambient.quantile([1, 2, 3], 0.5)).toBe(2)
    expect(ambient.quantile([1, 2, 3, 4], 0.5)).toBe(2.5)
})

test("sum function works correctly", () => {
    expect(ambient.sum([1, 2, 3])).toBe(6)
})

test("mean function works correctly", () => {
    expect(ambient.mean([1, 2, 3])).toBe(2)
})

test("std function works correctly", () => {
    expect(ambient.std([10, 12, 23, 23, 16, 23, 21, 16])).toBeCloseTo(4.8989794855664)
})

test("isPrime function works correctly", () => {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]
    const range = Array.from({ length: 100 }, (_, i) => i)
    const nonPrimes = range.filter(n => !primes.includes(n))
    primes.forEach(p => expect(ambient.isPrime(p)).toBe(true))
    nonPrimes.forEach(p => expect(ambient.isPrime(p)).toBe(false))
})

test("mode function works correctly", () => {
    expect(ambient.mode([1, 2, 3, 4, 5, 5, 5, 6, 7])).toBe(5)
})

test("variance function works correctly", () => {
    expect(ambient.variance([1, 2, 3, 4, 5])).toBeCloseTo(2)
})

test("compare date function works correctly", () => {
    const a = new Date("2021-01-01").toISOString()
    const b = new Date("2021-01-02").toISOString()
    const c = new Date("2021-01-03").toISOString()
    

    expect(ambient.compareDates("equals", {timestamp: a}, {timestamp: a})).toBe(true)
    expect(ambient.compareDates("equals", {timestamp: a}, {timestamp: b})).toBe(false)
    expect(ambient.compareDates("equals", {timestamp: a}, {timestamp: c})).toBe(false)

    expect(ambient.compareDates("after", {timestamp: a}, {timestamp: a})).toBe(false)
    expect(ambient.compareDates("after", {timestamp: a}, {timestamp: b})).toBe(false)
    expect(ambient.compareDates("after", {timestamp: a}, {timestamp: c})).toBe(false)
    expect(ambient.compareDates("after", {timestamp: b}, {timestamp: a})).toBe(true)

    expect(ambient.compareDates("before", {timestamp: a}, {timestamp: a})).toBe(false)
    expect(ambient.compareDates("before", {timestamp: a}, {timestamp: b})).toBe(true)
    expect(ambient.compareDates("before", {timestamp: a}, {timestamp: c})).toBe(true)
    expect(ambient.compareDates("before", {timestamp: b}, {timestamp: a})).toBe(false)

    expect(ambient.compareDates("after_or_equals", {timestamp: a}, {timestamp: a})).toBe(true)
    expect(ambient.compareDates("after_or_equals", {timestamp: a}, {timestamp: b})).toBe(false)
    expect(ambient.compareDates("after_or_equals", {timestamp: a}, {timestamp: c})).toBe(false)
    expect(ambient.compareDates("after_or_equals", {timestamp: b}, {timestamp: a})).toBe(true)

    expect(ambient.compareDates("before_or_equals", {timestamp: a}, {timestamp: a})).toBe(true)
    expect(ambient.compareDates("before_or_equals", {timestamp: a}, {timestamp: b})).toBe(true)
    expect(ambient.compareDates("before_or_equals", {timestamp: a}, {timestamp: c})).toBe(true)
    expect(ambient.compareDates("before_or_equals", {timestamp: b}, {timestamp: a})).toBe(false)
})

test("compare dates function works with masks", () => {
    const a = new Date("2021-01-01").toISOString()
    const b = new Date("2021-01-02").toISOString()
    const c = new Date("2021-01-03").toISOString()
    const e = new Date("2022-01-02").toISOString()

    expect(ambient.compareDates("equals", {timestamp: a, masked: ["year", "hour", "minute", "second"]}, {timestamp: a})).toBe(true)
    expect(ambient.compareDates("equals", {timestamp: b, masked: ["year", "hour", "minute", "second"]}, {timestamp: e})).toBe(true)
    expect(ambient.compareDates("equals", {timestamp: a, masked: ["day", "hour", "minute", "second"]}, {timestamp: b})).toBe(true)
    expect(ambient.compareDates("equals", {timestamp: a, masked: ["day", "hour", "minute", "second"]}, {timestamp: b, masked: ["day", "hour", "minute", "second"]})).toBe(true)

    expect(ambient.compareDates("equals", {timestamp: a, masked: ["year", "hour", "minute", "second"]}, {timestamp: b})).toBe(false)
    expect(ambient.compareDates("equals", {timestamp: a, masked: ["day", "hour", "minute", "second"]}, {timestamp: c})).toBe(true)

    expect(ambient.compareDates("after", {timestamp: a, masked: ["year", "hour", "minute", "second"]}, {timestamp: a})).toBe(false)
    expect(ambient.compareDates("after", {timestamp: a, masked: ["year", "hour", "minute", "second"]}, {timestamp: b})).toBe(false)
    expect(ambient.compareDates("after", {timestamp: c, masked: ["year", "hour", "minute", "second"]}, {timestamp: e})).toBe(true)
})