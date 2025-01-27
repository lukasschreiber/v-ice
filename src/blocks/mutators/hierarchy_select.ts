import types from '@/data/types';
import * as Blockly from 'blockly/core';
import { FieldHierarchy } from '../fields/field_hierarchy';
import { subscribe } from '@/store/subscribe';
import { BlockMutator } from '../block_mutators';

export interface HierarchySelectBlock {
    variableType: string,
    updateHierarchyField_(): void,
}

interface HierarchySelectState {
    variableType: string,
}

export class HierarchySelectMutator extends BlockMutator<Blockly.Block & HierarchySelectBlock, HierarchySelectState> implements HierarchySelectBlock {

    constructor() {
        super("hierarchy_select_mutator")
    }

    @BlockMutator.mixin
    variableType: string = ""

    @BlockMutator.mixin
    updateHierarchyField_(this: Blockly.Block & HierarchySelectBlock) {
        this.setOutput(true, this.variableType)

        const type = types.utils.fromString(this.variableType)
        if(!types.utils.isHierarchy(type)) return

        const hierarchy = types.registry.getHierarchy(type.hierarchy)
        if(!hierarchy) return

        const field = this.getField("HIERARCHY") as FieldHierarchy | null
        if (!field) return

        field.setHierarchy(hierarchy)
    }

    public saveExtraState(this: Blockly.Block & HierarchySelectBlock) {
        return {
            variableType: this.variableType,
        }
    }

    public loadExtraState(this: Blockly.Block & HierarchySelectBlock, state: HierarchySelectState) {
        this.variableType = state.variableType
        this.updateHierarchyField_()
    }

    public domToMutation(this: Blockly.Block & HierarchySelectBlock, xmlElement: Element) {
        this.variableType = xmlElement.getAttribute("variableType")!

        subscribe(state => state.sourceTable.columns, () => {
            this.updateHierarchyField_()
        }, {immediate: true})
    }

    public mutationToDom(this: Blockly.Block & HierarchySelectBlock) {
        const mutation = Blockly.utils.xml.createElement("mutation")
        mutation.setAttribute("variableType", this.variableType)
        return mutation
    }
}