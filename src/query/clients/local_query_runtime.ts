import { DataTable } from "@/data/table";

export type QueryFnReturnType<T> = {targets: Record<string, T>, edgeCounts: Record<string, number>}

export abstract class LocalQueryRuntime {
    public abstract execute(query: string, source: DataTable): Promise<QueryFnReturnType<DataTable>>
}