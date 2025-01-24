import { EventEmitter } from 'events';

const emitter = new EventEmitter();

export const showHelp = (activePage: string) => {
  emitter.emit('showHelp', activePage);
};

export default emitter;