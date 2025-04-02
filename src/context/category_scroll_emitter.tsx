import { EventEmitter } from 'events';

const emitter = new EventEmitter();

export const scrollToCategory = (id: string) => {
  emitter.emit('scrollToCategory', id);
};

export default emitter;