import { Lines, type Line, Points } from 'ixfx/geometry.js';
import { getLandmark, type PoseLandmarks } from './landmarks.js';
import type { PoseData } from './index.js';

/**
 * Sorts raw `poses` by horziontal.
 * Leftmost pose will be first.
 */
export const horizontalSort = (poses: PoseData[]) => {
  const withCentroids = poses.map(p => ({
    ...p,
    centroid: centroid(p)
  }));
  withCentroids.sort((a, b) => a.centroid.x - b.centroid.x);
  return withCentroids;
};

/**
 * Return centroid of Pose based on landmarks.
 * 
 */
export const centroid = (pose: PoseData) => Points.centroid(...pose.landmarks);

/**
 * Return centroid of pose based on world landmarks
 */
export const centroidWorld = (pose: PoseData) => Points.centroid(...pose.world);

/**
 * Returns a line between two named/indexed landmarks.
 * If either of the two points are not found, _undefined_ is returned.
 * @param pose Pose data 
 * @param a Landmark A
 * @param b Landmark B
 */
export const lineBetween = (pose: PoseData, a: PoseLandmarks | number, b: PoseLandmarks | number): Line | undefined => {
  if (pose === undefined) throw new TypeError(`Param 'pose' is undefined. Expected PoseData`);
  if (a === undefined) throw new TypeError(`Param 'a' is undefined, expected landmark name or index.`);
  if (b === undefined) throw new TypeError(`Param 'b' is undefined, expected landmark name or index.`);

  const ptA = getLandmark(pose, a);
  const ptB = getLandmark(pose, b);
  if (ptA === undefined) return;
  if (ptB === undefined) return;
  return Object.freeze({
    a: ptA,
    b: ptB
  });
};

/**
 * Returns the rough center of a pose, based on
 * the chest coordinates
 */
export const roughCenter = (pose: PoseData) => {
  if (pose === undefined) throw new Error(`Param 'pose' is undefined. Expected PoseData`);
  const a = lineBetween(pose, `left_shoulder`, `right_hip`);
  const b = lineBetween(pose, `right_shoulder`, `left_hip`);
  if (a === undefined) return;
  if (b === undefined) return;

  // Get halfway of each line
  const halfA = Lines.interpolate(0.5, a);
  const halfB = Lines.interpolate(0.5, b);

  // Add them up
  const sum = Points.sum(halfA, halfB);

  // Divide to get avg
  return Points.divide(sum, 2, 2);
};
