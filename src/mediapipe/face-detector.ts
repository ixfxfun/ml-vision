import type { ImageSource } from "@mediapipe/tasks-vision";
import { type IModel, type ComputeCallback, type FaceDetectorOptions } from "../types.js";
import * as Mp from '@mediapipe/tasks-vision';
import { Log } from "../util/log.js";

export class FaceDetector implements IModel {
  fd: Mp.FaceDetector | undefined;
  opts: FaceDetectorOptions;
  log;

  constructor(options: Partial<FaceDetectorOptions> = {}) {
    this.opts = {
      ...FaceDetector.defaults(),
      ...options
    }
    this.log = new Log(`FaceDetector`, this.opts.verbosity);
  }

  static defaults(): FaceDetectorOptions {
    return {
      verbosity: `errors`,
      wasmPath: './wasm',
      modelPath: './models/blaze_face_short_range.tflite',
      minDetectionConfidence: 0.5,
      minSupressionThreshold: 0.3
    }
  }

  compute(v: ImageSource, callback: ComputeCallback, timestamp: number): void {
    const results = this.fd?.detectForVideo(v, timestamp);
    callback(results);
  }

  dispose(): void {
    this.fd?.close();
    this.fd = undefined;
  }

  async init(): Promise<boolean> {
    const opts = this.opts;
    const vision = await Mp.FilesetResolver.forVisionTasks(opts.wasmPath);
    const mpOpts: Mp.FaceDetectorOptions = {
      baseOptions: {
        modelAssetPath: this.opts.modelPath
      },
      minDetectionConfidence: opts.minDetectionConfidence,
      minSuppressionThreshold: opts.minSupressionThreshold,
      runningMode: `VIDEO`
    }
    this.log.info(mpOpts);
    this.fd = await Mp.FaceDetector.createFromOptions(vision, mpOpts);
    return true;
  }

}