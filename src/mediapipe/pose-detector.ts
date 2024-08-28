import * as Mp from '@mediapipe/tasks-vision';
import type { ComputeCallback, IModel, PoseDetectorOptions } from '../types.js';
import { PoseMatcher } from './pose-matcher.js';
import { Log } from '../util/log.js';
// https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js#configuration_options

export class PoseDetector implements IModel {
  lp: Mp.PoseLandmarker | undefined;
  opts: PoseDetectorOptions;
  matcher: PoseMatcher;
  log;
  constructor(opts: Partial<PoseDetectorOptions> = {}) {
    this.opts = {
      ...PoseDetector.defaults(),
      ...opts
    };
    this.log = new Log(`PoseDetector`, this.opts.verbosity);
    this.matcher = new PoseMatcher(this.opts.matcher);
  }

  static defaults(): PoseDetectorOptions {
    return {
      numPoses: 5,
      minPoseDetectionConfidence: 0.3,
      minPosePresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
      outputSegmentationMasks: false,
      modelPath: './models/pose_landmarker_full.task',
      wasmPath: './wasm',
      verbosity: `errors`,
      matcher: {
        distanceThreshold: 0.1,
        maxAgeMs: 2000,
        verbosity: `errors`
      }
    }
  }
  compute(v: Mp.ImageSource, callback: ComputeCallback, timestamp: number) {
    this.lp?.detectForVideo(v, timestamp, poses => {
      const matched = [ ...this.matcher.toPoses(poses) ];
      callback(matched);
    });
  }

  async init() {
    const v = await Mp.FilesetResolver.forVisionTasks(this.opts.wasmPath);
    const opts = this.opts;
    const mpOpts: Mp.PoseLandmarkerOptions = {
      baseOptions: {
        modelAssetPath: opts.modelPath,
        delegate: `GPU`
      },
      runningMode: `VIDEO`,
      numPoses: opts.numPoses,
      minPoseDetectionConfidence: opts.minPoseDetectionConfidence,
      minPosePresenceConfidence: opts.minPosePresenceConfidence,
      minTrackingConfidence: opts.minTrackingConfidence,
      outputSegmentationMasks: opts.outputSegmentationMasks
    };
    this.log.info(mpOpts);


    this.lp = await Mp.PoseLandmarker.createFromOptions(v, mpOpts);
    return true;
  }

  dispose() {
    this.lp?.close();
    this.lp = undefined;
  }
}
