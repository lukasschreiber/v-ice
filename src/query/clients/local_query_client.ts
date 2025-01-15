import { QueryClient, QueryClientParams } from "@/query/clients/query_client";
import { AST, ASTNode, ASTOperation, ASTPrimitive } from "../builder/ast";
import { LocalQueryVerificator } from "./local_query_verificator";
import { LocalQueryRuntime } from "./local_query_runtime";
// import { BlockLinesDefinition, RegistrableBlock } from "@/blocks/block_definitions";
// import { RegistrableExtension } from "@/blocks/block_extensions";
// import { RegistrableMutator } from "@/blocks/block_mutators";

export interface LocalQueryClientParams extends QueryClientParams<"local"> {
    mode: "local";
    verificator: LocalQueryVerificator;
    runtime: LocalQueryRuntime;
    transformers: {
        operations: Record<string, (astNode: ASTOperation) => string>;
        primitives: Record<string, (astNode: ASTPrimitive) => string>;
        nodes: Record<string, (astNode: ASTNode) => string>;
    }
    // transformers: LocalQueryTransformer<RegistrableBlock<any, any, any>>[];
}

// export interface LocalQueryTransformer<T extends RegistrableBlock<any, any, any>> {
//     block: T;
//     transformer: {
//         transform(astNode: ReturnType<T["code"]>, block: T): string;
//     }
// }

// export function createTransformer<
//     Es extends RegistrableExtension[] = never[],
//     M extends RegistrableMutator = never,
//     L extends BlockLinesDefinition = never
// >(
//     block: RegistrableBlock<Es, M, L>,
//     transform: (astNode: ReturnType<RegistrableBlock<Es, M, L>["code"]> , block: RegistrableBlock<Es, M, L>) => string
// ): LocalQueryTransformer<RegistrableBlock<Es, M, L>> {
//     return {
//         block,
//         transformer: {
//             transform: transform
//         }
//     }
// }

export class LocalQueryClient extends QueryClient {
    protected verificator: LocalQueryVerificator;
    protected runtime: LocalQueryRuntime;

    constructor(params: LocalQueryClientParams) {
        super(params);
        this.verificator = params.verificator;
        this.runtime = params.runtime;
    }

    public async execute(query: string): Promise<any> {
        return this.runtime.execute(query);
    }

    public verify(query: string): boolean {
        return this.verificator.verify(query);
    }

    public astToQueryCode(ast: AST): string {
        console.log("Local query client converting AST to query code: ", ast);
        return "Local query code"
    }
}