import { Remote, type Options } from "@clinth/remote";

export type OnReceivedData = (msg: unknown) => void;

export class Client extends EventTarget {
  #remote;
  onData: OnReceivedData | undefined;

  constructor(options: Options = {}) {
    super();
    options = {
      allowNetwork: false,
      ...options
    }
    this.#remote = new Remote(options);
    this.#remote.onData = ((msg: unknown) => {
      const asObj = typeof msg === `object` ? msg : JSON.parse(msg as string);
      if (this.onData) this.onData(asObj);
      this.dispatchEvent(new CustomEvent(`message`, {
        detail: asObj
      }))
    });
  }
}