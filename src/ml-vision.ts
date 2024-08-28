import { VisionElement } from "./components/vision-element.js";
import type { ISource, Options, SourceData, SourceKinds, Verbosity } from "./types.js";
import { OverlayElement } from "./components/pose-overlay.js";
import { Processing } from "./processing.js";
import { PoseDetector } from "./mediapipe/pose-detector.js";
import { ObjectDetector } from "./mediapipe/object-detector.js";
import { FaceDetector } from "./mediapipe/face-detector.js";
import { Sources, type SourceStateChangeArgs } from "./sources/index.js";
import { Dispatcher } from "./dispatcher.js";
import { Recorder } from "./recorder.js";
import { Log } from "./util/log.js";
import { validateProcessorMode, type ProcessorModes } from "./processor-modes.js";

export const defaults = (mode: ProcessorModes): Options => {
  const opts: Options = {
    overlay: {
      label: true,
      show: true
    },
    camera: {
      facingMode: `user`,
    },
    computeFreqMs: 10,
    mode: mode,
    remote: {
      allowNetwork: false,
    },
    verbosity: `errors`
  }
  if (mode === `pose`) opts.pose = PoseDetector.defaults();
  else if (mode === `objects`) opts.objects = ObjectDetector.defaults();
  else if (mode === `face`) opts.face = FaceDetector.defaults();
  return opts;
};


export class MlVision extends EventTarget {
  el: VisionElement;
  sources;
  #overlayEl: OverlayElement | undefined;
  #proc
  dispatcher;
  #opts: Options;
  log
  constructor(elQuery: string, options: Partial<Options> = {}) {
    super();

    const lastMode = validateProcessorMode(localStorage.getItem(`last-mode`), `pose`);
    const opts = !options ? defaults(lastMode as ProcessorModes) : {
      ...defaults(options.mode ?? lastMode),
      ...options
    }
    this.#opts = opts;
    console.log(opts);
    this.log = new Log(`MlVision`, opts.verbosity);
    const el = document.querySelector(elQuery) as VisionElement | null;
    if (!el) throw new Error(`VisionElement not found with query: ${ elQuery }`);
    this.el = el;

    this.sources = new Sources(opts.camera, this);
    this.dispatcher = new Dispatcher(opts);
    this.#proc = new Processing(this, opts);
  }

  init() {
    const el = this.el;
    const opts = this.#opts;
    el.setOptions(opts);
    el.addEventListener(`source-startstop`, (event) => {
      const source = (event as CustomEvent).detail as SourceData;
      if (source.id !== this.sources.getCurrentId()) {
        // Different source
        this.log.info(`Different source. Id: ${ source.id } Existing: ${ this.sources.getCurrentId() }`);
        this.sources.stop();
        this.sources.setSource(source);
      }
      const started = this.sources.startStop();
    });

    // User has switched camera/file
    el.addEventListener(`request-source`, event => {
      const detail = (event as CustomEvent).detail as SourceData;
      this.sources.stop();
      this.sources.setSource(detail);
      this.sources.start();
    });

    el.addEventListener(`request-recorder`, () => {
      const r = this.sources.createRecorder();
      r.start(this.#proc.computeFreqMs);
      el.recorder = r;
    });

    el.addEventListener(`request-source-delete`, event => {
      const source = (event as CustomEvent).detail as SourceData;
      this.sources.delete(source);
    })

    el.addEventListener(`request-mode`, event => {
      const req = (event as CustomEvent).detail;
      console.log(req);
      this.#proc.setMode(validateProcessorMode(req.mode));
    });

    this.dispatcher.addEventListener(`data`, event => {
      const data = (event as CustomEvent).detail;
      el.onReceivedData(data.mode, data.data);
    });

    this.sources.addEventListener(`updated`, () => {
      el.onSourcesUpdated(this.sources.cameras, this.sources.recordings);
    })

    // Source has changed
    this.sources.addEventListener(`source-change`, event => {
      const source = (event as CustomEvent).detail as SourceData;
      el.notifySourceChange(source);
    })

    // Playback source video/camera has changed state
    this.sources.addEventListener(`state-change`, (e) => {
      const { priorState, newState } = (e as CustomEvent).detail as SourceStateChangeArgs;
      this.log.debug(`${ priorState }->${ newState }`);
      if (newState === `started`) {
        // Make sure processor is running too
        const video = el.getVideoElement();
        if (video) {
          this.#proc.stop();
          this.#proc.start(video);
        } else {
          console.warn(`Could not start processing because not video element is found`);
        }
      } else if (newState === `stopped`) {
        this.#proc.stop();
      }
      el.notifySourceState(newState, this.sources.currentSourceData);

    })

    this.sources.init();
  }

}