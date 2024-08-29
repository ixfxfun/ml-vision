import type { ImageSource } from "@mediapipe/tasks-vision"
import type { PoseMatcherOptions } from "./mediapipe/pose-matcher.js"
import type { Options as RemoteOptions } from "@clinth/remote"
import * as Mp from '@mediapipe/tasks-vision';
import type { ProcessorModes } from "./processor-modes.js";
import type { Landmark, NormalizedLandmark } from "./types-mp.js";

export type RecordingData = {
  name: string
  rateMs: number
  samples: any[]
  mode: string
}

export type SourceKinds = `camera` | `file` | `recording`;
export type Verbosity = `errors` | `info` | `debug`

export type SourceData = {
  kind: SourceKinds
  id: string
  label: string
}

export type CameraOptions = {
  width?: number
  height?: number
  facingMode?: `user` | `environment`
}

export type ObjectDetectorOptions = {
  verbosity: Verbosity
  scoreThreshold: number
  modelPath: string
}

export type CommonModelOptions = {
  wasmBase: string
  modelsBase: string
}

export interface ISource {
  start(): Promise<boolean>
  stop(): void
}

export type HandDetectorOptions = {
  verbosity: Verbosity
  numHands: number
  minHandDetectionConfidence: number
  minHandPresenceConfidence: number
  minTrackingConfidence: number
  modelPath: string
}

export type FaceDetectorOptions = {
  verbosity: Verbosity
  modelPath: string
  /**
   * Default: 0.5
   */
  minDetectionConfidence: number
  /**
   * Default: 0.3
   */
  minSupressionThreshold: number
}

export type PoseDetectorOptions = {
  numPoses: number
  minPoseDetectionConfidence: number
  minPosePresenceConfidence: number
  minTrackingConfidence: number
  outputSegmentationMasks: boolean
  modelPath: string
  matcher: PoseMatcherOptions
  verbosity: Verbosity
}

export type OverlayOptions = {
  show: boolean
  label: boolean
}


export type Options = {
  camera: CameraOptions
  hideModelSelector?: boolean
  mode: ProcessorModes
  overlay: OverlayOptions
  pose?: PoseDetectorOptions
  objects?: ObjectDetectorOptions
  hand?: HandDetectorOptions
  face?: FaceDetectorOptions
  computeFreqMs: number
  remote: RemoteOptions
  /**
   * 'errors','info','debug'
   */
  verbosity: Verbosity
  wasmBase: string
  modelsBase: string
}


export type ComputeCallback = (result: unknown) => void
export type OnDispatcherData = (mode: ProcessorModes, v: unknown) => void;

export interface IModel {
  compute(v: ImageSource, callback: ComputeCallback, timestamp: number): void;
  dispose(): void;
  init(): Promise<boolean>;
}


export type PoseData = {
  poseid: string,
  landmarks: NormalizedLandmark[],
  world: Landmark[]
}

