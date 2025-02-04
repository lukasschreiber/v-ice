import "./index.css"

import "@/window"
// Import the following four only for side effects
import "@/i18n"
import "@/blockly_patches"
import "@/contextmenu_items"

import "@/blocks/block_extensions"
import "@/blocks/block_definitions"

import "@/blocks/fields/field_textinput"
import "@/blocks/fields/field_number"
import "@/blocks/fields/field_edge_connection"
import "@/blocks/fields/field_variable"
import "@/blocks/fields/field_dynamic_dropdown"
import "@/blocks/fields/field_label_target_node"
import "@/blocks/fields/field_type_label"
import "@/blocks/fields/field_local_variable"
import "@/blocks/fields/field_filterable_dynamic_dropdown"
import "@/blocks/fields/field_datetime"
import "@/blocks/fields/field_set_selection"
import "@/blocks/fields/field_dependent_dropdown"
import "@/blocks/fields/field_autocomplete_textinput"
import "@/blocks/fields/field_hierarchy"
import "@/blocks/fields/field_button"

import "@/blocks/extensions/scoped"
import "@/blocks/extensions/parent_color"
import "@/blocks/extensions/dynamic_event"
import "@/blocks/extensions/dynamic_event_matches"
import "@/blocks/extensions/node"
import "@/blocks/extensions/flatten_list"

import "@/blocks/mutators/dynamic_input_types"
import "@/blocks/mutators/enum_select"
import "@/blocks/mutators/column_select"
import "@/blocks/mutators/variable_select"
import "@/blocks/mutators/local_variable"
import "@/blocks/mutators/hierarchy_select"
import "@/blocks/mutators/list_select"
import "@/blocks/mutators/struct_select"
import "@/blocks/mutators/either_or"
import "@/blocks/mutators/struct_property_select"
import "@/blocks/mutators/math_is_divisibleby"
import "@/blocks/mutators/event_does_not_occur_for"
import "@/blocks/mutators/list_any_all"

import { BlockLinesDefinition, RegistrableBlock, createBlock } from "@/blocks/block_definitions"
import * as MathBlocks from "@/blocks/definitions/math"
import * as EnumBlocks from "@/blocks/definitions/enums"
import * as VariableBlocks from "@/blocks/definitions/variables"
import * as NodeBlocks from "@/blocks/definitions/nodes"
import * as ComparisonBlocks from "@/blocks/definitions/comparisons"
import * as ListBlocks from "@/blocks/definitions/lists"
import * as StructBlocks from "@/blocks/definitions/structs"
import * as LogicBlocks from "@/blocks/definitions/logic"
import * as TimelineBlocks from "@/blocks/definitions/timeline"

import { LightTheme, DarkTheme } from "./themes/themes"

import "@/connection_checker";

export * from "@/query/query_generator"

import { useContext, useRef } from "react"
import { IPublicSettingsContext, SettingsContext } from "@/context/settings/settings_context"
import { ApplicationContextProvider } from "@/context/app_context_provider"
import { Canvas as CanvasElement } from "@/components/Canvas"
import { useDispatch, useSelector } from "@/store/hooks"
import { DataTable } from "@/data/table"
import { setTargetBlocks } from "./store/blockly/blockly_slice"
import * as Blockly from "blockly/core"
import Types from "@/data/types"
import { WorkspaceContext } from "@/context/workspace_context"
import { ISerializedWorkspace, clearWorkspace, deserializeWorkspace, serializeWorkspace } from "./serializer"
import { defineToolbox, defineBlock, defineCategory, blockDefinitionToBlock, blockToBlockDefinition } from "./blocks/toolbox/toolbox_definition"
import emitter, { EvaluationAction } from "./evaluation_emitter"
import { ManualPage as ManualPageElement } from "./components/ManualPage"
import { Variables } from "./blocks/toolbox/categories/variables"
import { Nodes } from "./blocks/toolbox/categories/nodes"
import { DefaultToolbox } from "./blocks/toolbox/default_toolbox"
import { RegistrableExtension } from "@/blocks/block_extensions"
import { RegistrableMutator } from "./blocks/block_mutators"
import { CompleteToolbox } from "./blocks/toolbox/complete_toolbox"
import { jsQueryClient } from "./query/clients/javascript/js_query_client"
import { selectSourceDataTable, setSourceTable } from "./store/data/source_table_slice"
import { subscribe } from "./store/subscribe"

/**
 * The main component for the Blockly editor. This component should be wrapped in a `VICEProvider`.
 * @example
 * <VICEProvider>
 *     <Canvas />
 * </VICEProvider>
 */
export const Canvas = CanvasElement

export const HelpPage = ManualPageElement

/**
 * Provider for the Blockly context. This provider should wrap the entire application.
 * @example
 * <VICEProvider>
 *     <App />
 * </VICEProvider>
 */
export const VICEProvider = ApplicationContextProvider

/**
 * Hook to get the current generated code.
 * @returns The current generated code.
 * @example
 * const { code } = useGeneratedCode()
 * console.log(code) // the code generated from the blocks in the canvas
 */
export function useGeneratedCode() {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const unsubscribe = subscribe((state) => state.settings.debugger, (debuggerEnabled) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (!debuggerEnabled.code || !debuggerEnabled.ast || !debuggerEnabled.blocklyJson || !debuggerEnabled.blocklyXml) {
                console.warn("Some debugging options are disabled. The generated code may not be up to date.");
            }
            unsubscribe();
        }, 500);
    });

    return useSelector((state) => state.generatedCode)
}

/**
 * Hook to get the current settings and a function to update them.
 * @returns The current settings and a function to update them.
 * @example
 * const { settings, set } = useSettings()
 * set("grid", true)
 * console.log(settings.grid) // true
 */
export function useSettings(): IPublicSettingsContext {
    return useContext(SettingsContext)
}

export function useWorkspace() {
    const workspaceRef = useContext(WorkspaceContext).workspaceRef
    return {
        workspace: workspaceRef.current!,
        load: (state: ISerializedWorkspace, target: Blockly.WorkspaceSvg = workspaceRef.current!) => deserializeWorkspace(target, state),
        save: (workspace: Blockly.WorkspaceSvg = workspaceRef.current!) => serializeWorkspace(workspace),
        clear: () => clearWorkspace(workspaceRef.current!)
    }
}

/**
 * Hook to get the current query result.
 * @returns The current query result.
 * @example
 * const { queryResult } = useQuery()
 * console.log(queryResult) // the result of the query
 */
export function useQuery() {
    const dispatch = useDispatch()
    const querySource = useSelector(selectSourceDataTable)
    const targetBlocks = useSelector(state => state.blockly.targetBlocks)

    const resultTables = useSelector((state) => state.resultTables);

    const getQueryResultById = (id: string) => {
        const normalizedTable = resultTables[id];
        return normalizedTable ? DataTable.fromNormalizedTable(normalizedTable) : null;
    };

    return {
        getQueryResultById,
        querySource: querySource,
        setQuerySource: (source: DataTable) => {
            dispatch(setSourceTable(source.toNormalizedTable()))
        },
        addTarget: (name: string, id: string) => {
            if (/[^a-zA-Z0-9_]/.test(name)) {
                throw new Error(`Target name must only contain alphanumeric characters and underscores`)
            }
            dispatch(setTargetBlocks({ ...targetBlocks, [id]: name }))
            return id
        },
        removeTarget: (id: string) => {
            const newTargets = { ...targetBlocks }
            delete newTargets[id]
            dispatch(setTargetBlocks(newTargets))
        },
        setTargets: (targets: Record<string, string>) => dispatch(setTargetBlocks(targets)),
        targets: targetBlocks
    }
}

const Toolbox = {
    defineToolbox,
    defineBlock,
    defineCategory,
    Categories: {
        Variables: Variables,
        Nodes: Nodes
    },
    Defaults: {
        Default: DefaultToolbox,
        Complete: CompleteToolbox,
        Empty: defineToolbox([])
    },
    utils: {
        blockDefinitionToBlock,
        blockToBlockDefinition
    }
}

const Blocks = {
    Math: MathBlocks,
    Enum: EnumBlocks,
    Variable: VariableBlocks,
    Node: NodeBlocks,
    Comparison: ComparisonBlocks,
    List: ListBlocks,
    Struct: StructBlocks,
    Logic: LogicBlocks,
    Timeline: TimelineBlocks,
}

const Extensions = import.meta.glob("@/blocks/extensions/*.ts")
const Mutators = import.meta.glob("@/blocks/mutators/*.ts")

const Evaluation = {
    events: emitter,
    Action: EvaluationAction
}

export const Themes = {
    LightTheme, 
    DarkTheme
}

export const Clients = {
    js: jsQueryClient
}

// Move this to a separate file together with the block definitions
export function getBlockDefinitionById<
    Es extends RegistrableExtension[],
    M extends RegistrableMutator,
    L extends BlockLinesDefinition,
    T extends RegistrableBlock<Es, M, L>
>(id: T["id"] | undefined): T | undefined  {
    if (!id) return undefined
    return Object.entries(Blocks).flatMap(([_, category]) => Object.values(category)).find(block => block.id === id) as T | undefined
}

// Move this to a separate file together with the block definitions
export function getBlockDefinitionNameById(id: string | undefined): string | undefined {
    if (!id) return undefined
    return Object.entries(Blocks).flatMap(([_, category]) => Object.entries(category)).find(([_, block]) => block.id === id)?.[0]
}

export { Toolbox, Blocks, Evaluation, Extensions, Mutators, Types, createBlock }

export { DataTable, DataColumn, type DataRow, type CsvOptions, type IndexedDataRow, type ColumnType, type SerializedTable, type SerializedColumn, type TableSaveFile } from "@/data/table"
export { type IType, type IListType, type IStructType, type IEnumType, type IEventType, type IIntervalType, type INumberType, type IStringType, type IBooleanType, type ITimestampType, type ValueOf } from "@/data/types"
export { type ISerializedWorkspace } from "./serializer"
export { type ToolboxDefinition, type FlyoutItemInfo, type BlockInfo } from "blockly/core/utils/toolbox"
export { BlockPreview } from "@/components/common/BlockPreview"
export { WorkspacePreview } from "@/components/common/WorkspacePreview"