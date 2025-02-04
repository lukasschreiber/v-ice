import { DataTable, NormalizedDataTable } from "@/data/table";
import { subscribe } from "@/store/subscribe";

export type QueryFnReturnType<T> = {targets: Record<string, T>, edgeCounts: Record<string, number>}

export abstract class LocalQueryRuntime {
    protected source: NormalizedDataTable | null = null;

    public initialize(): Promise<void> {
        subscribe((state) => state.sourceTable, (value) => {
            this.source = value;
        });
        return Promise.resolve();
    }
    public abstract execute(query: string): Promise<QueryFnReturnType<DataTable>>
    public dispose(): void {}
}