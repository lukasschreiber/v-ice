import * as Blockly from "blockly/core"
import * as eventUtils from "@/events/utils"
import { Blocks } from "@/blocks"

export class EdgeCreate extends Blockly.Events.UiBase {
    fromNodeBlockId: string | undefined
    toNodeBlockId: string | undefined
    fromFieldName: string | undefined
    toFieldName: string | undefined

    override type = eventUtils.EDGE_CREATE

    constructor(
        opt_fromNodeBlockId?: string,
        opt_toNodeBlockId?: string,
        opt_fromFieldName?: string,
        opt_toFieldName?: string,
        opt_workspaceId?: string,
    ) {
        super(opt_workspaceId);

        this.fromNodeBlockId = opt_fromNodeBlockId;
        this.toNodeBlockId = opt_toNodeBlockId;
        this.fromFieldName = opt_fromFieldName;
        this.toFieldName = opt_toFieldName;
        this.recordUndo = true;
    }

    override run(_forward: boolean): void {
        const workspace = this.getEventWorkspace_();

        if (!this.fromNodeBlockId || !this.toNodeBlockId) {
            throw new Error(
                'The block ID is undefined. Either pass a block to ' +
                'the constructor, or call fromJson',
            );
        }

        const fromBlock = workspace.getBlockById(this.fromNodeBlockId);
        const toBlock = workspace.getBlockById(this.toNodeBlockId);

        if (!Blocks.Types.isNodeBlock(fromBlock) || !Blocks.Types.isNodeBlock(toBlock)) {
            throw new Error(
                'The associated block is undefined. Either pass a ' +
                'block to the constructor, or call fromJson',
            );
        }

        Blockly.Events.disable();
        if (_forward) {
            fromBlock.connectNode(toBlock, this.fromFieldName!, this.toFieldName!)
        } else {
            const connection = fromBlock.edgeConnections.get(this.fromFieldName!)?.connections.find(conn => {
                const targetBlock = conn.targetBlock()
                if(targetBlock && Blocks.Types.isNodeBlock(targetBlock)) {
                    return targetBlock.edgeConnections.get(this.toFieldName!)?.connections.includes(conn.targetConnection!)
                }
                return false
            
            })
            if(connection) {
                fromBlock.unplugNodeConnection(connection)
                toBlock.unplugNodeConnection(connection)
            }
        }
        Blockly.Events.enable();
    }

    override toJson(): EdgeCreateJson {
        const json = super.toJson() as EdgeCreateJson;
        json['fromNodeBlockId'] = this.fromNodeBlockId;
        json['toNodeBlockId'] = this.toNodeBlockId;
        json['fromFieldName'] = this.fromFieldName;
        json['toFieldName'] = this.toFieldName;
        return json;
    }

    static fromJson(
        json: EdgeCreateJson,
        workspace: Blockly.Workspace,
        event?: unknown,
    ): EdgeCreate {
        const newEvent = super.fromJson(
            json,
            workspace,
            event ?? new EdgeCreate(),
        ) as EdgeCreate;
        newEvent.fromNodeBlockId = json['fromNodeBlockId'];
        newEvent.toNodeBlockId = json['toNodeBlockId'];
        newEvent.fromFieldName = json['fromFieldName'];
        newEvent.toFieldName = json['toFieldName'];
        return newEvent;
    }
}

export interface EdgeCreateJson extends Blockly.Events.AbstractEventJson {
    fromNodeBlockId?: string;
    toNodeBlockId?: string;
    fromFieldName?: string;
    toFieldName?: string;
}


Blockly.registry.register(Blockly.registry.Type.EVENT, eventUtils.EDGE_CREATE, EdgeCreate)