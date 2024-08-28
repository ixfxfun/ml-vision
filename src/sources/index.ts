import type { VideoSourceElement } from "../components/video-source.js";
import type { MlVision } from "../ml-vision.js";
import { Recorder } from "../recorder.js";
import type { CameraOptions, ISource, SourceData, SourceKinds, Verbosity } from "../types.js";
import { Log } from "../util/log.js";
import { CameraSources } from "./camera-sources.js";
import { RecordPlayer } from "./record-player.js";
import { Recordings } from "./recording-sources.js";
import { VideoElementSource } from "./video-element-source.js";

export type SourcesState = `starting` | `started` | `stopped`
export type SourceStateChangeArgs = {
  priorState: SourcesState
  newState: SourcesState
}

/**
 * Event: 'updated','state-change'
 */
export class Sources extends EventTarget {
  #camera;
  #recordings;

  #state: SourcesState = `stopped`;
  #current: ISource | undefined;
  #currentData: SourceData | undefined;
  #videoEl: VideoSourceElement | undefined;
  #cameraOpts: CameraOptions;
  log;
  constructor(cameraOptions: CameraOptions, readonly mlv: MlVision) {
    super();
    this.log = new Log(`Sources`, mlv.log);
    this.#cameraOpts = cameraOptions;
    this.#camera = new CameraSources(this);
    this.#recordings = new Recordings(this);
  }

  delete(source: SourceData) {
    if (source.kind !== `recording`) throw new Error(`Cannot delete type: ${ source.kind }`);
    this.#recordings.delete(source);
  }

  get isStarted() {
    return this.#state === `started`;
  }

  createRecorder() {
    return new Recorder(this.#recordings, this.mlv.dispatcher);
  }

  startStop(): boolean {
    if (this.#state === `stopped`) {
      this.start();
      return true;
    } else if (this.#state === `started`) {
      this.stop();
      return false;
    } else {
      console.warn(`Cannot start/stop in state: ${ this.#state }`);
      return false;
    }
  }

  kindMatch(kind: SourceKinds) {
    if (this.#currentData) {
      if (this.#currentData.kind === kind) return true;
    }
    return false;
  }
  async start() {
    this.#setState(`starting`);

    const sourceData = this.#currentData;
    if (!sourceData) throw new Error(`Cannot start, no source data available`);

    // Resolve source
    let source: ISource | undefined;
    let videoEl = this.#videoEl;
    if (!videoEl) {
      videoEl = this.#videoEl = this.mlv.el.getVideoSource();
    }
    switch (sourceData.kind) {
      case `camera`: {
        if (!videoEl) throw new Error(`No video element`);
        source = new VideoElementSource(videoEl, sourceData, this.#cameraOpts);
        break;
      }
      case `file`: {
        if (!videoEl) throw new Error(`No video element`);
        source = new VideoElementSource(videoEl, sourceData, this.#cameraOpts);
        break;
      }
      case `recording`: {
        const rec = this.#recordings.getRecording(sourceData.id);
        if (rec) {
          source = new RecordPlayer(rec, this.mlv.dispatcher);
        } else {
          console.warn(`Could not get recording: ${ sourceData.id }`);
        }
      }
    }

    this.#current = source;
    if (await source?.start()) {
      this.#setState(`started`);
    } else {
      this.#setState(`stopped`);
    }
  }

  stop() {
    const current = this.#current;
    if (current) {
      try {
        current.stop();
        this.#current = undefined;
      } catch (error) {
        console.error(error);
      }
    }
    this.#setState(`stopped`);
  }

  get cameras() {
    return this.#camera.cameras;
  }

  get recordings() {
    return this.#recordings.getSources();
  }

  init() {
    this.#camera.init();
    this.#recordings.init();
  }

  setSource(sourceData: SourceData) {
    this.log.debug(`setSource: ${ JSON.stringify(sourceData) }`);
    this.#currentData = sourceData;
    this.dispatchEvent(new CustomEvent(`source-change`, { detail: sourceData }));
  }

  getCurrentId() {
    if (this.#currentData) return this.#currentData.id;
    return ``;
  }

  notifySourceUpdated(source: any) {
    this.dispatchEvent(new CustomEvent(`updated`, {
      detail: source
    }));
    if (source === this.#camera && !this.#current) {
      const c = this.#camera.cameras[ 0 ];
      if (c) {
        this.setSource(c);
        this.start();
      }
    }
  }

  #setState(state: SourcesState) {
    const prior = this.#state;
    if (prior === state) return;
    this.#state = state;
    if (state === `starting` && prior !== `stopped`) throw new Error(`Cannot transition ${ prior } -> ${ state }`);
    this.log.debug(`state ${ prior } -> ${ state } (current: ${ JSON.stringify(this.#currentData) })`);
    const dict: SourceStateChangeArgs = {
      priorState: prior,
      newState: state
    }
    this.dispatchEvent(new CustomEvent(`state-change`, { detail: dict }));
  }

  get currentSourceData() {
    return this.#currentData;
  }

}