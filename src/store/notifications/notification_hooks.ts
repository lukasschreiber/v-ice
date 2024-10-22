import { useContext } from "react";
import { NotificationContext } from "./notification_context";

export const useNotification = () => {
    return useContext(NotificationContext);
};