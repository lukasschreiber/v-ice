export enum NotificationType {
    ConnectionFailure = "ConnectionFailure",
    NodeLinkConnectionFailureCycle = "NodeLinkConnectionFailureCycle",
    NodeLinkConnectionFailure = "NodeLinkConnectionFailure",
    NodeLinkConnectionFailureSelf = "NodeLinkConnectionFailureSelf",
    LocalVariableOutOfScope = "LocalVariableOutOfScope",
    LocalVariableDisposed = "LocalVariableDisposed"
}

export type NotificationLocalStorageEntry = Record<NotificationType, number | null>;

export const notificationConfig: Record<NotificationType, Record<number, number | null>> = {
    [NotificationType.ConnectionFailure]: {
        0: 5000,
        1: 2500,
        10: 1500,
        20: null
    },
    [NotificationType.NodeLinkConnectionFailureCycle]: {
        0: 5000,
        1: 2500,
        10: 1500,
        20: null
    },
    [NotificationType.NodeLinkConnectionFailure]: {
        0: 5000,
        1: 2500,
        10: 1500,
        20: null
    },
    [NotificationType.NodeLinkConnectionFailureSelf]: {
        0: 5000,
        1: 2500,
        10: null
    },
    [NotificationType.LocalVariableOutOfScope]: {
        0: 5000,
        1: 2500,
        10: 1500,
        20: null
    },
    [NotificationType.LocalVariableDisposed]: {
        0: 5000,
        1: 2500,
        10: 1500,
    }
};