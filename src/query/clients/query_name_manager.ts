export class NameManager {
    private usedNames: Set<string> = new Set()

    constructor(private reservedWords: string[], private prefix: string = "") {

    }

    public getUniqueName(name: string): string {
        let newName = name
        let i = 0
        while (this.usedNames.has(newName) || this.reservedWords.includes(newName)) {
            newName = i === 0 ? `${this.prefix}${name}` : `${this.prefix}${name}${i}`
            i++
        }

        this.usedNames.add(newName)
        return newName
    }

    public reset() {
        this.usedNames.clear()
    }
}