import types from '@/data/types';
import * as Blockly from 'blockly/core';
import { FieldHierarchy } from '../fields/field_hierarchy';
import { subscribe } from '@/store/subscribe';

export interface HierarchySelectBlock extends Blockly.Block {
    variableType: string,
    updateHierarchyField_(): void,
}

interface HierarchySelectState {
    variableType: string,
}

const hierarchySelectMixin: Partial<HierarchySelectBlock> = {
    saveExtraState: function (this: HierarchySelectBlock) {
        return {
            variableType: this.variableType,
        }
    },
    loadExtraState: function (this: HierarchySelectBlock, state: HierarchySelectState) {
        this.variableType = state.variableType
        this.updateHierarchyField_()
    },
    domToMutation: function (this: HierarchySelectBlock, xmlElement: Element) {
        this.variableType = xmlElement.getAttribute("variableType")!

        subscribe(state => state.data.source, () => {
            this.updateHierarchyField_()
        }, {immediate: true})
    },
    mutationToDom: function (this: HierarchySelectBlock) {
        const mutation = Blockly.utils.xml.createElement("mutation")
        mutation.setAttribute("variableType", this.variableType)
        return mutation
    },
    updateHierarchyField_: function (this: HierarchySelectBlock) {
        this.setOutput(true, this.variableType)

        const type = types.utils.fromString(this.variableType)
        if(!types.utils.isHierarchy(type)) return

        const hierarchy = types.registry.getHierarchy(type.hierarchy)
        if(!hierarchy) return

        const field = this.getField("HIERARCHY") as FieldHierarchy | null
        if (!field) return

        field.setHierarchy(hierarchy)
    }
}

Blockly.Extensions.registerMutator(
    'hierarchy_select_mutator',
    hierarchySelectMixin,
);