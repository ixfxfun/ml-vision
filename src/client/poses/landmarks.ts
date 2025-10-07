import type { PoseData } from "./index";
import type { Landmark, NormalizedLandmark } from "../index";

const posePoints: PoseLandmarks[] = [ "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel", "left_foot_index", "right_foot_index" ];

export type PoseLandmarks = "nose" | "left_eye_inner" | "left_eye" | "left_eye_outer" | "right_eye_inner" | "right_eye" | "right_eye_outer" | "left_ear" | "right_ear" | "mouth_left" | "mouth_right" | "left_shoulder" | "right_shoulder" | "left_elbow" | "right_elbow" | "left_wrist" | "right_wrist" | "left_pinky" | "right_pinky" | "left_index" | "right_index" | "left_thumb" | "right_thumb" | "left_hip" | "right_hip" | "left_knee" | "right_knee" | "left_ankle" | "right_ankle" | "left_heel" | "right_heel" | "left_foot_index" | "right_foot_index"

/**
 * Returns indexes for right foot: ankle, heel, index
 */
export const footRightIndexes = [ 27, 29, 31 ]

/**
 * Returns indexes for left foot: ankle, heel, index
 */
export const footLeftIndexes = [ 28, 30, 32 ]

/**
 * Returns indexes for right shoulder, elbow, wrist (but not pinky, index & thumb)
 */
export const armRightIndexes = [ 12, 14, 16 ]

/**
 * Returns indexes for left wrist, pinky, index & thumb
 */
export const armHandRightIndexes = [ 16, 18, 20, 22 ]


/**
 * Returns indexes for left shoulder, elbow, wrist (but not pinky, index & thumb)
 */
export const armLeftIndexes = [ 11, 13, 15 ]

/**
 * Returns indexes for left wrist, pinky, index & thumb
 */
export const armHandLeftIndexes = [ 15, 17, 19, 21 ]



/**
 * Returns indexes for nose, eyes, ears & mouth
 */
export const faceIndexes = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 9 ]

/**
 * Returns indexes for shoulders and hips
 */
export const torsoIndexes = [ 12, 11, 23, 24 ]

/**
 * Returns indexes for left hip, knee, ankle (but not foot)
 */
export const legLeftIndexes = [ 23, 25, 27 ]

/**
 * Returns indexes for right hip, knee, ankle (but not foot)
 */
export const legRightIndexes = [ 24, 26, 28 ]


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