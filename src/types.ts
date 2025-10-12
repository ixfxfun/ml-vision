import type { ImageSource } from "@mediapipe/tasks-vision"
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

/**
 * Object detector options.
 * 
 * Preset model names:
 * * EfficientDet-Lite0: lite0-8, lite0-16, lite0-32
 * * EfficientDet-Lite2: lite2-8, lite2-16, lite2-32
 * * SSDMObileNet-V2: mobilenet2-8, mobilenet2-32
 */
export type ObjectDetectorOptions = {
  verbosity: Verbosity
  scoreThreshold: number
  modelPath: string,
  presetModelPaths?: Record<string, string>
}

export type CommonModelOptions = {
  wasmBase: string
  modelsBase: string
}

export interface ISource {
  start(): Promise<boolean>
  stop(): void
}

export type PoseMatcherOptions = {
  /**
   * If pose is more than this distance away, assume it's a different body
   * Default: 0.1
   */
  distanceThreshold: number
  /**
   * If a pose hasn't been seen for this long, delete.
   * Default: 2000
   */
  maxAgeMs: number

  verbosity: Verbosity
}

export type HandDetectorOptions = {
  verbosity: Verbosity
  numHands: number
  minHandDetectionConfidence: number
  minHandPresenceConfidence: number
  minTrackingConfidence: number
  modelPath: string
  presetModelPaths?: Record<string, string>
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
  presetModelPaths?: Record<string, string>
}

/**
 * Preset model names: lite, full, heavy.
 */
export type PoseDetectorOptions = {
  numPoses: number
  minPoseDetectionConfidence: number
  minPosePresenceConfidence: number
  minTrackingConfidence: number
  outputSegmentationMasks: boolean
  modelPath: string
  matcher: PoseMatcherOptions
  verbosity: Verbosity
  presetModelPaths?: Record<string, string>
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

