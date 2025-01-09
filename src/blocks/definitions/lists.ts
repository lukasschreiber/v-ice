import { Blocks } from "@/blocks";
import { ConnectionType, registerBlocks } from "../block_definitions";
import t from "@/data/types";
import { Colors } from "@/themes/colors";
import { ParentColorExtension } from "../extensions/parent_color";
import { FlattenListExtension } from "../extensions/flatten_list";

export default registerBlocks([
    {
        id: Blocks.Names.LIST.MATH,
        message0: "%1 %{BKY_OF} %2",
        args0: [
            {
                type: "field_dropdown",
                name: "OP",
                options: [
                    ["%{BKY_SUM}", "SUM"],
                    ["%{BKY_AVERAGE}", "AVERAGE"],
                    ["%{BKY_STD_DEV}", "STD"],
                    ["%{BKY_MIN}", "MIN"],
                    ["%{BKY_Q1}", "Q1"],
                    ["%{BKY_MEDIAN}", "MEDIAN"],
                    ["%{BKY_Q3}", "Q3"],
                    ["%{BKY_MAX}", "MAX"],
                    ["%{BKY_MODE}", "MODE"],
                    ["%{BKY_VARIANCE}", "VARIANCE"],
                    ["%{BKY_RANGE}", "RANGE"],
                    ["%{BKY_IQR}", "IQR"],
                    ["%{BKY_COUNT}", "COUNT"],
                ],
            },
            {
                type: "input_value",
                name: "LIST",
                check: t.list(t.number)
            },
        ],
        output: t.number,
        helpUrl: "#list-operations",
        style: "list_blocks",
    },
    {
        id: Blocks.Names.LIST.LENGTH,
        message0: "%{BKY_LENGTH} %{BKY_OF} %1",
        args0: [
            {
                type: "input_value",
                name: "LIST",
                check: t.list(t.nullable(t.wildcard))
            },
        ],
        output: t.number,
        helpUrl: "#list-length",
        style: "list_blocks",
    },
    {
        id: Blocks.Names.LIST.CONTAINS,
        message0: "%1 %{BKY_CONTAINS} %2",
        args0: [
            {
                type: "input_value",
                name: "LIST",
                check: t.list(t.nullable(t.wildcard))
            },
            {
                type: "input_value",
                name: "VALUE",
                check: t.nullable(t.wildcard)
            },
        ],
        style: "list_blocks",
        inputsInline: true,
        mutator: "dynamic_input_types",
        helpUrl: "#list-contains",
        connectionType: ConnectionType.BOOLEAN,
        
    },
    {
        id: Blocks.Names.LIST.ANY_ALL,
        message0: "%{BKY_TRUE} %{BKY_FOR} %1 %2 %{BKY_OF} %3",
        message1: "%1",
        args0: [
            {
                type: "field_dropdown",
                name: "OP",
                options: [
                    ["%{BKY_ANY}", "ANY"],
                    ["%{BKY_ALL}", "ALL"],
                ],
            },
            {
                type: "field_local_variable",
                name: "VALUE",
                text: "%{BKY_VALUE}",
                shapeType: t.wildcard
            },
            {
                type: "input_value",
                name: "LIST",
                check: t.list(t.nullable(t.wildcard))
            }
        ],
        args1: [
            {
                type: "input_statement",
                name: "QUERY",
                check: ConnectionType.BOOLEAN
            },
        ],
        style: "list_blocks",
        inputsInline: true,
        
        connectionType: ConnectionType.BOOLEAN,
        helpUrl: "#list-any-all",
        mutator: "list_any_all_mutator"
    },
    {
        id: Blocks.Names.LIST.IMMEDIATE,
        message0: "",
        output: t.list(t.wildcard),
        color: Colors.categories.comparisons,
        inputsInline: true,
        extensions: [ParentColorExtension],
        mutator: "list_select_mutator"
    },
    {
        id: Blocks.Names.LIST.FLATTEN,
        message0: "%{BKY_FLATTEN} %1",
        args0: [
            {
                type: "input_value",
                name: "LIST",
                check: t.list(t.list(t.nullable(t.wildcard)))
            }
        ],
        output: t.list(t.nullable(t.wildcard)),
        style: "list_blocks",
        helpUrl: "#list-flatten",
        extensions: [FlattenListExtension]
    },
    {
        id: Blocks.Names.LIST.EQUALS,
        message0: "%1 %2 %3",
        args0: [
            {
                type: "input_value",
                name: "LIST1",
                check: t.list(t.nullable(t.wildcard))
            },
            {
                type: "field_dropdown",
                name: "OP",
                options: [
                    ["%{BKY_EQUALS}", "EQUALS"],
                    ["%{BKY_CONTAINS_SEQUENCE}", "CONTAINS"],
                    ["%{BKY_STARTS_WITH}", "STARTS_WITH"],
                    ["%{BKY_ENDS_WITH}", "ENDS_WITH"],
                    ["%{BKY_CONTAINS_ALL_ITEMS_OF}", "CONTAINS_ALL_ITEMS_OF"],
                ],
            },
            {
                type: "input_value",
                name: "LIST2",
                check: t.list(t.nullable(t.wildcard))
            },
        ],
        style: "list_blocks",
        inputsInline: true,
        mutator: "dynamic_input_types",
        helpUrl: "#list-equals",
        connectionType: ConnectionType.BOOLEAN,
        
    }
] as const)