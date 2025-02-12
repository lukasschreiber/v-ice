import { Blocks } from "@/blocks";
import { ConnectionType, createBlock } from "@/blocks/block_definitions";
import t from "@/data/types"
import { ParentColorExtension } from "../extensions/parent_color";
import { EitherOrMutator } from "../mutators/either_or";
import { ASTNodeKind, createASTNode } from "@/query/builder/ast";

export const LogicOrBlock = createBlock({
    id: Blocks.Names.LOGIC.OR,
    lines: [
        {
            text: "%{BKY_EITHER}",
            args: []
        },
        {
            text: "%1",
            args: [
                {
                    type: "input_statement",
                    name: "OR_STATEMENT_0",
                    check: ConnectionType.BOOLEAN,
                },
            ]
        },
        {
            text: "%{BKY_OR}",
            args: []
        },
        {
            text: "%1",
            args: [
                {
                    type: "input_statement",
                    name: "OR_STATEMENT_1",
                    check: ConnectionType.BOOLEAN,
                },
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    style: "logic_blocks",
    helpUrl: "#logic-or",
    mutator: EitherOrMutator,
    code: (scope) => {
        // TODO: This only takes the first inner statement because - what did I want to say here???

        const additionalArgs: { [key: string]: any } = {}
        scope.block.getAdditionalOrBranchInputNames().forEach((name, i) => {
            additionalArgs[`OR_STATEMENT_${i + 2}`] = scope.buildASTForUnknownStatementInput(name)
        })

        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "or",
            type: t.boolean,
            args: {
                OR_STATEMENT_0: scope.buildASTForStatementInput("OR_STATEMENT_0"),
                OR_STATEMENT_1: scope.buildASTForStatementInput("OR_STATEMENT_1"),
                ...additionalArgs,
            },
        })
    }
})

export const LogicNotBlock = createBlock({
    id: Blocks.Names.LOGIC.NOT,
    lines: [
        {
            text: "%{BKY_NOT}",
            args: []
        },
        {
            text: "%1",
            args: [
                {
                    type: "input_statement",
                    name: "STATEMENTS",
                    check: ConnectionType.BOOLEAN,
                },
            ]
        }
    ] as const,
    connectionType: ConnectionType.BOOLEAN,
    style: "logic_blocks",
    helpUrl: "#logic-not",
    code: (scope) => {
        return createASTNode(ASTNodeKind.Operation, scope.definition, {
            operation: "not",
            type: t.boolean,
            args: {
                STATEMENTS: scope.buildASTForStatementInput("STATEMENTS"),
            }
        })
    }
})

export const BooleanBlock = createBlock({
    id: Blocks.Names.LOGIC.BOOLEAN,
    lines: [
        {
            text: "%1",
            args: [
                {
                    type: "field_dropdown",
                    name: "BOOL",
                    options: [
                        ["%{BKY_TRUE}", "TRUE"],
                        ["%{BKY_FALSE}", "FALSE"],
                    ],
                },
            ]
        }
    ] as const,
    output: t.boolean,
    extensions: [ParentColorExtension],
    style: "comparisons_blocks",
    code: (scope) => {
        return createASTNode(ASTNodeKind.Primitive, scope.definition, { value: scope.getFieldValue("BOOL") === "TRUE", type: t.boolean })
    }
})
