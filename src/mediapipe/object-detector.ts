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
      scoreThreshold: 0.5,
      presetModelPaths: {
        'lite0-8': `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/int8/latest/efficientdet_lite0.tflite`,
        'lite0-16': `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite`,
        'lite0-32': `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite`,
        'lite2-8': `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/int8/latest/efficientdet_lite2.tflite`,
        'lite2-16': `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/latest/efficientdet_lite2.tflite`,
        'lite2-32': `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float32/latest/efficientdet_lite2.tflite`,
        'mobilenet2-8': `https://storage.googleapis.com/mediapipe-models/object_detector/ssd_mobilenet_v2/float16/latest/ssd_mobilenet_v2.tflite`,
        'mobilenet2-32': `https://storage.googleapis.com/mediapipe-models/object_detector/ssd_mobilenet_v2/float32/latest/ssd_mobilenet_v2.tflite`
      }
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
    const opts = this.opts;
    const presets = this.opts.presetModelPaths ?? ObjectDetector.defaults().presetModelPaths as Record<string, string>;

    const vision = await Mp.FilesetResolver.forVisionTasks(p.wasmBase);
    const mpOpts: Mp.ObjectDetectorOptions = {
      baseOptions: {
        modelAssetPath: makeModelPath(p.modelsBase, this.opts.modelPath, presets)
      },
      scoreThreshold: 0.5,
      runningMode: `VIDEO`
    }
    this.od = await Mp.ObjectDetector.createFromOptions(vision, mpOpts);

    this.log.info(mpOpts);
    return true;
  }

}