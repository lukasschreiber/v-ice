import * as Blockly from 'blockly';
import { FieldButton } from '../fields/field_button';
import { IconFactory } from '../icon_factory';
import { BlockMutator } from '../block_mutators';

export interface EitherOrBlock {
    addOrBranch(id?: string): void
    removeOrBranch(): void
    getAdditionalOrBranchInputNames(): string[]
    inputNames: string[]
}

interface EitherOrState {
    inputNames: string[]
}

export class EitherOrMutator extends BlockMutator<Blockly.Block & EitherOrBlock, EitherOrState> implements EitherOrBlock {
    constructor() {
        super("either_or_mutator")
    }

    @BlockMutator.mixin
    inputNames: string[] = []

    @BlockMutator.mixin
    public addOrBranch(this: Blockly.Block & EitherOrBlock, id?: string) {
        const check = this.inputList.find(input => input.type === Blockly.inputs.inputTypes.STATEMENT)?.connection?.getCheck()
        if (!check || this.isInFlyout) return

        const uid = id ?? Blockly.utils.idGenerator.genUid()
        this.appendDummyInput(`OR_LABEL_${uid}`).appendField(Blockly.Msg.OR, `OR_LABEL_FIELD_${uid}`)
        const statement = this.appendStatementInput(`OR_STATEMENT_${uid}`)
        statement.connection?.setCheck(check)

        this.inputNames.push(uid)

        this.moveInputBefore("BUTTONS", null)
    }

    @BlockMutator.mixin
    public removeOrBranch(this: Blockly.Block & EitherOrBlock) {
        const customOrStatements = this.inputNames.map(uid => ({ label: this.getInput(`OR_LABEL_${uid}`)!, statement: this.getInput(`OR_STATEMENT_${uid}`)! }))
        if (customOrStatements.length === 0) return

        // delete the first empty one, starting from the end
        const lastEmptyIndex = customOrStatements.findIndex(({ statement }) => statement.connection?.targetConnection === null)
        const indexToDelete = lastEmptyIndex === -1 ? customOrStatements.length - 1 : lastEmptyIndex

        const { label, statement } = customOrStatements[indexToDelete]

        if (lastEmptyIndex === -1) {
            // if we are deleting the last statement we need to move the blocks inside it to an empty one if it exists
            const emptyStatements = this.inputList.filter(input => input.type === Blockly.inputs.inputTypes.STATEMENT && !input.connection?.targetConnection)
            const emptyStatement = emptyStatements.pop()
            if (emptyStatement) {
                const targetConnection = statement.connection?.targetConnection
                if (targetConnection) {
                    targetConnection.connect(emptyStatement.connection!)
                }
            }
        }

        this.removeInput(label.name)
        this.removeInput(statement.name)
        this.inputNames.splice(indexToDelete, 1)
    }

    @BlockMutator.mixin
    public getAdditionalOrBranchInputNames(this: Blockly.Block & EitherOrBlock) {
        return this.inputNames.map(uid => (`OR_STATEMENT_${uid}`))

    }

    public saveExtraState(this: Blockly.Block & EitherOrBlock) {
        return {
            inputNames: this.inputNames
        }
    }

    public loadExtraState(this: Blockly.Block & EitherOrBlock, state: EitherOrState) {
        this.inputNames = state.inputNames

        this.inputNames.forEach(uid => {
            this.appendDummyInput(`OR_LABEL_${uid}`).appendField(Blockly.Msg.OR, `OR_LABEL_FIELD_${uid}`)
            const statement = this.appendStatementInput(`OR_STATEMENT_${uid}`)
            const check = this.inputList.find(input => input.type === Blockly.inputs.inputTypes.STATEMENT)?.connection?.getCheck()
            if (check) {
                statement.connection?.setCheck(check)
            }
        })
        this.moveInputBefore("BUTTONS", null)
    }

    public extension(this: Blockly.Block & EitherOrBlock): void {
        const addIcon = IconFactory.wrapIcon(IconFactory.createPlusIcon("white", 12))
        const addButton = new FieldButton(addIcon, { width: 12, height: 12, svg: addIcon });
        addButton.addClickListener(() => this.addOrBranch())

        const removeIcon = IconFactory.wrapIcon(IconFactory.createMinusIcon("white", 12))
        const removeButton = new FieldButton(removeIcon, { width: 12, height: 12, svg: removeIcon });
        removeButton.addClickListener(() => this.removeOrBranch())

        this.appendDummyInput("BUTTONS").appendField(addButton, "ADD").appendField(removeButton, "REMOVE")
    }
}

