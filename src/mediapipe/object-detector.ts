import type { ImageSource } from "@mediapipe/tasks-vision";
import { type IModel, type ComputeCallback, type ObjectDetectorOptions, type Options, type CommonModelOptions } from "../types.js";
import * as Mp from '@mediapipe/tasks-vision';
import { Log } from "../util/log.js";
import { makeModelPath } from "./makeModelPath.js";

export class ObjectDetector implements IModel {
  od: Mp.ObjectDetector | undefined;
  opts: ObjectDetectorOptions;
  log;

  constructor(readonly p: CommonModelOptions, options: Partial<ObjectDetectorOptions> = {}) {
    this.opts = {
      ...ObjectDetector.defaults(),
      ...options
    };
    this.log = new Log(`ObjectDetector`, this.opts.verbosity);
  }

  static defaults(): ObjectDetectorOptions {
    return {
      verbosity: `errors`,
      modelPath: 'efficientdet_lite0.tflite',
      scoreThreshold: 0.5
    }
  }

  compute(v: ImageSource, callback: ComputeCallback, timestamp: number): void {
    const results = this.od?.detectForVideo(v, timestamp);
    callback(results);
  }

  dispose(): void {
    this.od?.close();
    this.od = undefined;
  }

  async init(): Promise<boolean> {
    const p = this.p;
    const vision = await Mp.FilesetResolver.forVisionTasks(p.wasmBase);
    const mpOpts: Mp.ObjectDetectorOptions = {
      baseOptions: {
        modelAssetPath: makeModelPath(p.modelsBase, this.opts.modelPath)
      },
      scoreThreshold: 0.5,
      runningMode: `VIDEO`
    }
    this.od = await Mp.ObjectDetector.createFromOptions(vision, mpOpts);

    this.log.info(mpOpts);
    return true;
  }

}