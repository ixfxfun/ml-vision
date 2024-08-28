import { Remote } from '@clinth/remote';
import type { OnDispatcherData, Options } from './types.js';
import type { ProcessorModes } from './processor-modes.js';

export type DispatcherDataArgs = {
  data: any
  mode: ProcessorModes
}
export class Dispatcher extends EventTarget {
  #remote;
  onData: OnDispatcherData | undefined;

  constructor(options: Options) {
    super();
    this.#remote = new Remote(options.remote);
  }

  receivedData(mode: ProcessorModes, data: any) {
    if (!data) return;
    if (this.#remote) {
      this.#remote.send(JSON.stringify(data));
    }

    if (this.onData) this.onData(mode, data);

    const args: DispatcherDataArgs = { data, mode }
    this.dispatchEvent(new CustomEvent(`data`, {
      detail: args
    }));

  }
}