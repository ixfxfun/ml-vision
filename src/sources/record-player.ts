import type { Dispatcher } from "../dispatcher.js";
import type { ProcessorModes } from "../processor-modes.js";
import type { ISource, RecordingData } from "../types.js";

export class RecordPlayer implements ISource {
  #timer: number = 0;

  constructor(readonly data: RecordingData, readonly dispatcher: Dispatcher) {

  }

  async start() {
    let pos = 0;
    const mode = this.data.mode as ProcessorModes;
    const samples = this.data.samples;

    this.#timer = setInterval(() => {
      //callback(this.data.samples[ pos ]);
      this.dispatcher.receivedData(mode, samples[ pos ])
      pos++;
      if (pos >= this.data.samples.length) pos = 0;
    }, this.data.rateMs * 2);
    return true;
  }

  stop() {
    clearInterval(this.#timer);
  }
}
