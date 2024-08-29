import { PoseDetector } from './mediapipe/pose-detector.js';
import { ObjectDetector } from './mediapipe/object-detector.js';
import type { CommonModelOptions, FaceDetectorOptions, HandDetectorOptions, IModel, ObjectDetectorOptions, Options, PoseDetectorOptions } from './types.js';
import { MlVision } from './ml-vision.js';
import { FaceDetector } from './mediapipe/face-detector.js';
import { HandDetector } from './mediapipe/hand-detector.js';
import { Log } from './util/log.js';
import { validateProcessorMode, type ProcessorModes } from './processor-modes.js';

export type ProcessingStates = `queued-start` | `starting` | `started` | `stopping` | `stopped`;

export class Processing extends EventTarget {
  #state: ProcessingStates = `stopped`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #updateTimer: any;
  #model: IModel | undefined;
  #currentMode: ProcessorModes = `face`;
  #videoEl: HTMLVideoElement | undefined;
  log;
  dispatcher;

  poseOptions: PoseDetectorOptions;
  objectDetectorOptions: ObjectDetectorOptions;
  faceDetectorOptions: FaceDetectorOptions;
  handDetectorOptions: HandDetectorOptions;
  computeFreqMs: number;
  dispatcherBound;
  wasmBase: string;
  modelsBase: string;

  constructor(readonly mlv: MlVision, opts: Options) {
    super();
    this.#currentMode = opts.mode;
    this.wasmBase = opts.wasmBase;
    this.modelsBase = opts.modelsBase;
    this.log = new Log(`Processing`, opts.verbosity);
    this.dispatcher = mlv.dispatcher;
    this.dispatcherBound = this.dispatcher.receivedData.bind(this.dispatcher);
    this.computeFreqMs = opts.computeFreqMs;
    this.poseOptions = opts.pose ?? PoseDetector.defaults();
    this.objectDetectorOptions = opts.objects ?? ObjectDetector.defaults();
    this.faceDetectorOptions = opts.face ?? FaceDetector.defaults();
    this.handDetectorOptions = opts.hand ?? HandDetector.defaults();
  }

  stop() {
    if (this.#state === `stopping` || this.#state === `stopped`) return;
    this.setState(`stopping`);
    this.#model?.dispose();
    this.#model = undefined;
    this.setState(`stopped`);
  }

  setMode(mode: ProcessorModes) {
    if (mode === this.currentMode) return;
    if (typeof mode !== `string`) throw new Error(`Expected string. Got: ${ typeof mode }`);
    validateProcessorMode(mode);

    localStorage.setItem(`last-mode`, mode);
    const video = this.#videoEl;
    if (!video) return;
    this.stop();
    this.#currentMode = mode;
    this.start(video);
  }

  getModelOptions() {
    const modelOpts: CommonModelOptions = {
      wasmBase: this.wasmBase,
      modelsBase: this.modelsBase
    }
    return modelOpts;
  }
  async start(video: HTMLVideoElement) {
    this.setState(`starting`);
    this.#videoEl = video;


    switch (this.#currentMode) {
      case `pose`: {
        this.log.info(this.poseOptions);
        this.#model = new PoseDetector(this.getModelOptions(), this.poseOptions);
        break;
      }
      case `objects`: {
        this.log.info(this.objectDetectorOptions);
        this.#model = new ObjectDetector(this.getModelOptions(), this.objectDetectorOptions);
        break;
      }
      case `face`: {
        this.log.info(this.faceDetectorOptions);
        this.#model = new FaceDetector(this.getModelOptions(), this.faceDetectorOptions);
        break;
      }
      case `hand`: {
        this.log.info(this.handDetectorOptions);
        this.#model = new HandDetector(this.getModelOptions(), this.handDetectorOptions);
        break;
      }
      default: {
        throw new Error(`Unsupported mode '${ this.#currentMode }'. Expected: 'hand', 'pose', 'objects' or 'face'`)
      }
    }
    if (this.#model) {
      this.#model.init();
      this.setState(`started`);
    }
  }

  #run() {
    const v = this.#videoEl;
    if (!v) {
      console.warn(`No video element`);
      return;
    }

    this.#model?.compute(v, (data) => this.dispatcher.receivedData(this.#currentMode, data), performance.now());

    if (this.#state === `started`) {
      this.#updateTimer = setTimeout(() => this.#run(), this.computeFreqMs);
    }
  }

  setState(state: ProcessingStates) {
    if (this.#state === state) return;
    const prior = this.#state;

    if (state === `starting`) {
      if (prior !== `stopped` && prior !== `queued-start`) throw new Error(`Cannot start when in state: ${ prior }`);
    }
    if (state === `started`) {
      if (prior !== `starting`) throw new Error(`Cannot go to 'started' when state is: ${ prior }`)
    }

    this.#state = state;

    if (state === `started`) {
      this.#updateTimer = setTimeout(() => this.#run(), this.computeFreqMs);
    } else {
      if (this.#updateTimer) {
        clearTimeout(this.#updateTimer);
      }
      this.#updateTimer = 0;
    }

    this.log.debug(`State ${ prior } -> ${ state }`);
    this.dispatchEvent(new CustomEvent(`state`, {
      detail: {
        priorState: prior,
        newState: state
      }
    }));
  }

  get isStarted() {
    return this.#state === `started`;
  }

  get currentMode() {
    return this.#currentMode;
  }



}