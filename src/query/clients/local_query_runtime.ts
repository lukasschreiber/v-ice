export abstract class LocalQueryRuntime {
    public abstract execute(query: string): Promise<any>
}