import { EventEmitter } from 'events';
import { ISerializedWorkspace } from './serializer';

export enum EvaluationAction {
    OpenHelp = 'openHelp',
    CopyBlock = 'copyBlock',
    SentNotification = 'sentNotification',
    ClickOnCategory = 'clickOnCategory',
    CreateBlockInToolbox = 'createBlockInToolbox',
    ChangeZoom = 'changeZoom',
    OpenSettings = 'openSettings',
    ChangeSetting = 'changeSetting',
    UseZoomInButton = 'useZoomInButton',
    UseZoomOutButton = 'useZoomOutButton',
    UseCenterButton = 'useCenterButton',
    UseMagicWand = 'useMagicWand',
    ClickContextMenuItem = 'clickContextMenu',
    WorkspaceChanged = 'workspaceChanged',
}

export type EvaluationActionPayloads = {
    [EvaluationAction.OpenHelp]: {directLink: string | undefined};
    [EvaluationAction.CopyBlock]: { blockType: string };
    [EvaluationAction.SentNotification]: { message: string };
    [EvaluationAction.ClickOnCategory]: { category: string };
    [EvaluationAction.CreateBlockInToolbox]: { blockType: string };
    [EvaluationAction.ChangeZoom]: { zoom: number };
    [EvaluationAction.OpenSettings]: undefined;
    [EvaluationAction.ChangeSetting]: { key: string, value: string | boolean | number };
    [EvaluationAction.UseZoomInButton]: undefined;
    [EvaluationAction.UseZoomOutButton]: undefined;
    [EvaluationAction.UseCenterButton]: undefined;
    [EvaluationAction.UseMagicWand]: { workspaceState: ISerializedWorkspace };
    [EvaluationAction.ClickContextMenuItem]: { menuItem: string, blockType?: string, context: "block" | "edge" | "workspace"};
    [EvaluationAction.WorkspaceChanged]: { workspaceState: ISerializedWorkspace };
};
export type EvaluationActionEvent = {
    action: EvaluationAction;
    payload: EvaluationActionPayloads[EvaluationAction];
};

export type EventTypes = {
    evaluationActionOccured: EvaluationActionEvent;
};

export class TypedEventEmitter<Events extends Record<string, unknown>> {
    private emitter = new EventEmitter();

    on<E extends keyof Events>(event: E, listener: (payload: Events[E]) => void): this {
        this.emitter.on(event as string, listener as (...args: unknown[]) => void);
        return this;
    }

    off<E extends keyof Events>(event: E, listener: (payload: Events[E]) => void): this {
        this.emitter.off(event as string, listener as (...args: unknown[]) => void);
        return this;
    }

    emit<E extends keyof Events>(event: E, payload: Events[E]): boolean {
        return this.emitter.emit(event as string, payload);
    }
}

const emitter = new TypedEventEmitter<EventTypes>();

export function triggerAction<T extends EvaluationAction>(action: T, payload?: EvaluationActionPayloads[T]) {
    emitter.emit('evaluationActionOccured', {action, payload});
}

export default emitter;