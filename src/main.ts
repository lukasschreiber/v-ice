import "./index.css"

import "@/window"
// Import the following four only for side effects
import "@/i18n"
import "@/blockly_patches"
import "@/contextmenu_items"

import "@/blocks/block_extensions"
import "@/blocks/block_definitions"

import "@/blocks/fields"
import "@/blocks/extensions"
import "@/blocks/mutators"

import "@/blocks/definitions/math"
import "@/blocks/definitions/variables"
import "@/blocks/definitions/nodes"
import "@/blocks/definitions/comparisons"
import "@/blocks/definitions/lists"
import "@/blocks/definitions/structs"
import "@/blocks/definitions/logic"
import "@/blocks/definitions/timeline"

import "@/query/generation/comparisons"
import "@/query/generation/variables"
import "@/query/generation/math"
import "@/query/generation/lists"
import "@/query/generation/enum"
import "@/query/generation/logic"
import "@/query/generation/timeline"
import "@/query/generation/nodes"

import "@/connection_checker";

export * from "@/query/query_generator"

import { useContext, useMemo } from "react"
import { IPublicSettingsContext, SettingsContext } from "@/store/settings/settings_context"
import { ApplicationContextProvider } from "@/store/app_context_provider"
import { Canvas as CanvasElement } from "@/components/Canvas"
import { useDispatch, useSelector } from "@/store/hooks"
import { DataTable } from "@/data/table"
import { setSource } from "@/store/data/data_slice"
import { setTargetBlocks } from "./store/blockly/blockly_slice"
import * as Blockly from "blockly/core"
import Types from "@/data/types"
import { WorkspaceContext } from "./workspace_context"
import { ISerializedWorkspace, clearWorkspace, deserializeWorkspace, serializeWorkspace } from "./serializer"
import { defineToolbox, defineBlock, defineCategory, blockDefinitionToBlock, blockToBlockDefinition } from "./blocks/toolbox/toolbox_definition"
import emitter, { EvaluationAction } from "./evaluation_emitter"
import { HelpPage as HelpPageElement } from "./components/HelpPage"
import { queryGenerator } from "@/query/query_generator"
import { runQuery } from "@/query/query_runner"

/**
 * The main component for the Blockly editor. This component should be wrapped in a `BlocklyProvider`.
 * @example
 * <BlocklyProvider>
 *     <Canvas />
 * </BlocklyProvider>
 */
export const Canvas = CanvasElement

export const HelpPage = HelpPageElement

/**
 * Provider for the Blockly context. This provider should wrap the entire application.
 * @example
 * <BlocklyProvider>
 *     <App />
 * </BlocklyProvider>
 */
export const BlocklyProvider = ApplicationContextProvider

/**
 * Hook to get the current generated code.
 * @returns The current generated code.
 * @example
 * const { code } = useGeneratedCode()
 * console.log(code) // the code generated from the blocks in the canvas
 */
export function useGeneratedCode() {
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
        load: (state: ISerializedWorkspace) => deserializeWorkspace(workspaceRef.current!, state),
        save: () => serializeWorkspace(workspaceRef.current!),
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
    const querySource = useSelector(state => state.data.source)
    const queryResults = useSelector(state => state.data.queryResults)
    const targetBlocks = useSelector(state => state.blockly.targetBlocks)

    return {
        queryResults: useMemo(() => {
            const deserialized: Record<string, DataTable> = {}
            for (const [id, table] of Object.entries(queryResults)) {
                deserialized[id] = DataTable.deserialize(table)
            }
            return deserialized
        }, [queryResults]),
        querySource: useMemo(() => DataTable.deserialize(querySource), [querySource]),
        setQuerySource: (source: DataTable) => {
            dispatch(setSource(source.serialize()))
        },
        addTarget: (name: string) => {
            const id = Blockly.utils.idGenerator.genUid()
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
    utils: {
        blockDefinitionToBlock,
        blockToBlockDefinition
    }
}

export const Evaluation = {
    events: emitter,
    Action: EvaluationAction
}

export { Toolbox }

export { DataTable, DataColumn, type DataRow, type CsvOptions, type IndexedDataRow, type ColumnType, type SerializedTable, type SerializedColumn, type TableSaveFile } from "@/data/table"
export { type IType, type IListType, type IStructType, type IEnumType, type IEventType, type IIntervalType, type INumberType, type IStringType, type IBooleanType, type ITimestampType, type ValueOf } from "@/data/types"
export { Types }
export { type ISerializedWorkspace } from "./serializer"

export const QueryBackend = {
    generateQuery: (workspace: Blockly.Workspace) => {
        const code = queryGenerator.workspaceToCode(workspace)
        return code
    },
    runQuery: (query: string, source: DataTable) => {
        return runQuery(query, source)
    }
}