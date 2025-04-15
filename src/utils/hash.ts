export function hash(element: unknown): number {
    const string = JSON.stringify(element)
    let hash = 0;
    for (var i = 0; i < string.length; i++) {
        let code = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + code;
        hash = hash & hash;
    }
    return hash
}

export function hashString(element: unknown, fn?: (hash: number) => string): string {
    return (fn || (hash => hash.toString()))(hash(element))
}