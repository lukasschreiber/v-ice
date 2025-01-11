import { QueryGenerator } from "./query_generator";

let queryGeneratorInstance: QueryGenerator | null = null;

export function getQueryGeneratorInstance(): QueryGenerator {
    if (!queryGeneratorInstance) {
        queryGeneratorInstance = new QueryGenerator();
    }
    return queryGeneratorInstance;
}