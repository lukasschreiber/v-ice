import { EventEmitter } from 'events';
import { NotificationType } from './notification_config';

const emitter = new EventEmitter();

export const showNotification = (message: string, type?: NotificationType) => {
  emitter.emit('showNotification', message, type);
};

export default emitter;