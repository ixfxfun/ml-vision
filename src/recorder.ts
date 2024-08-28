import type { RecordingData } from "./types.js";
import type { Dispatcher, DispatcherDataArgs } from "./dispatcher.js";
import type { Recordings } from "./sources/recording-sources.js";
import { Log } from "./util/log.js";
import type { ProcessorModes } from "./processor-modes.js";

export type RecorderStates = `idle` | `recording` | `complete`;

export class Recorder extends EventTarget {
  #state: RecorderStates = `idle`;
  #mode: ProcessorModes | undefined;

  buffer: any[] = [];
  computeFreqMs: number = 0;
  onDataBound;
  log = new Log(`Recorder`, `info`);

  constructor(readonly recordings: Recordings, readonly dispatcher: Dispatcher) {
    super();
    this.onDataBound = this.onData.bind(this);
  }

  start(computeFreqMs: number) {
    this.computeFreqMs = computeFreqMs;
    this.#setState(`recording`);
    this.dispatcher.addEventListener(`data`, this.onDataBound);
  }

  get length() {
    return this.buffer.length;
  }

  onData(event: Event) {
    const detail = (event as CustomEvent).detail as DispatcherDataArgs;
    const data = detail.data;
    const mode = detail.mode;
    this.#mode = mode;
    this.buffer.push(data);
    if (this.buffer.length % 5 === 0) {
      this.log.info(`Recorder: ${ this.buffer.length } samples`);
    }
  }

  stop() {
    this.#setState(`complete`);
    this.dispatcher.removeEventListener(`data`, this.onDataBound);

    const name = this.recordings.promptName();
    if (name) {
      const rec: RecordingData = {
        rateMs: this.computeFreqMs,
        samples: this.buffer,
        mode: this.#mode!,
        name
      }
      this.recordings.add(rec);
    }
    this.buffer = [];
  }

  #setState(state: RecorderStates) {
    const prior = this.#state;
    if (state === prior) return;
    this.#state = state;
    if (state === `recording` && prior !== `idle`) throw new Error(`Cannot transition ${ prior } - > ${ state }`);
    if (state === `complete` && prior !== `recording`) throw new Error(`Cannot transition ${ prior } - > ${ state }`);
    this.log.debug(`${ prior } -> ${ state }`);
    this.dispatchEvent(new CustomEvent(`state-change`, {
      detail: {
        priorState: prior,
        newState: state
      }
    }));
  }

  get state() {
    return this.#state;
  }
}