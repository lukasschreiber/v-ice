export class NameManager {
    private usedNames: Set<string> = new Set()
    private nameMap: Map<string, string> = new Map()

    constructor(private reservedWords: string[], private prefix: string = "") {

    }

    public createUniqueName(id: string, name: string): string {
        let newName = this.getUniqueName(name)
        this.nameMap.set(id, newName)
        return newName
    }

    public getName(id: string): string {
        const name = this.nameMap.get(id)
        if (!name) {
            throw new Error(`Name not found for id: ${id}`)
        }

        return name
    }

    protected getUniqueName(name: string): string {
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
        this.nameMap.clear()
    }
}