import type { PoseData } from "./index";
import type { Landmark, NormalizedLandmark } from "../index";

const posePoints: PoseLandmarks[] = [ "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel", "left_foot_index", "right_foot_index" ];

export type PoseLandmarks = "nose" | "left_eye_inner" | "left_eye" | "left_eye_outer" | "right_eye_inner" | "right_eye" | "right_eye_outer" | "left_ear" | "right_ear" | "mouth_left" | "mouth_right" | "left_shoulder" | "right_shoulder" | "left_elbow" | "right_elbow" | "left_wrist" | "right_wrist" | "left_pinky" | "right_pinky" | "left_index" | "right_index" | "left_thumb" | "right_thumb" | "left_hip" | "right_hip" | "left_knee" | "right_knee" | "left_ankle" | "right_ankle" | "left_heel" | "right_heel" | "left_foot_index" | "right_foot_index"

/**
 * Returns landmark index by name, or _undefined_ if not found
 * @param name 
 * @returns 
 */
export const getLandmarkIndexByName = (name: PoseLandmarks | string): number | undefined => {
  for (let i = 0; i < posePoints.length; i++) {
    if (posePoints[ i ] === name) return i;
  }
}

/**
 * Returns landmark name by index, throws if 'index' out of range.
 * @param index 
 * @returns 
 */
export const getLandmarkNameByIndex = (index: number): PoseLandmarks => {
  if (typeof index !== `number`) throw new Error(`Expected numeric index. Got: ${ typeof index }`);
  if (index < 0) throw new Error(`Index should be at least 0`);
  if (index >= posePoints.length) throw new Error(`Index is higher than expected (${ index })`);
  return posePoints[ index ];
}

export const getLandmark = (pose: PoseData, indexOrName: number | PoseLandmarks): NormalizedLandmark | undefined => {
  if (typeof indexOrName === `number`) {
    return pose.landmarks[ indexOrName ];
  } else {
    const index = getLandmarkIndexByName(indexOrName);
    if (!index) return;
    return pose.landmarks[ index ];
  }
}

export const getWorldLandmark = (pose: PoseData, indexOrName: number | PoseLandmarks): Landmark | undefined => {
  if (typeof indexOrName === `number`) {
    return pose.world[ indexOrName ];
  } else {
    const index = getLandmarkIndexByName(indexOrName);
    if (!index) return;
    return pose.world[ index ];
  }
}