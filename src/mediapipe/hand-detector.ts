import type { ImageSource } from "@mediapipe/tasks-vision";
import { type IModel, type ComputeCallback, type HandDetectorOptions, type CommonModelOptions } from "../types.js";
import * as Mp from '@mediapipe/tasks-vision';
import { Log } from "../util/log.js";
import { makeModelPath } from "./makeModelPath.js";

export class HandDetector implements IModel {
  hd: Mp.HandLandmarker | undefined;
  opts: HandDetectorOptions;
  log;

  constructor(readonly p: CommonModelOptions, options: Partial<HandDetectorOptions> = {}) {
    this.opts = {
      ...HandDetector.defaults(),
      ...options
    }
    this.log = new Log(`HandDetector`, this.opts.verbosity);
  }

  static defaults(): HandDetectorOptions {
    return {
      verbosity: `errors`,
      numHands: 2,
      modelPath: 'hand_landmarker.task',
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }
  }

  compute(v: ImageSource, callback: ComputeCallback, timestamp: number): void {
    const results = this.hd?.detectForVideo(v, timestamp);
    callback(results);
  }

  dispose(): void {
    this.hd?.close();
    this.hd = undefined;
  }

  async init(): Promise<boolean> {
    const opts = this.opts;
    const p = this.p;
    const vision = await Mp.FilesetResolver.forVisionTasks(p.wasmBase);
    const mpOpts: Mp.HandLandmarkerOptions = {
      baseOptions: {
        modelAssetPath: makeModelPath(p.modelsBase, this.opts.modelPath)
      },
      minHandDetectionConfidence: opts.minHandDetectionConfidence,
      minHandPresenceConfidence: opts.minHandPresenceConfidence,
      minTrackingConfidence: opts.minTrackingConfidence,
      numHands: opts.numHands,
      runningMode: `VIDEO`
    }
    this.hd = await Mp.HandLandmarker.createFromOptions(vision, mpOpts);

    this.log.info(mpOpts);
    return true;
  }

}