import * as Mp from '@mediapipe/tasks-vision';
import { Points, type Point } from 'ixfx/geometry.js';
import { shortGuid } from 'ixfx/random.js';
import type { PoseData, Verbosity } from '../types.js';
import { Log } from '../util/log.js';

class TrackedPose {
  centroid: Point = Points.Empty;
  firstSeen: number = performance.now();
  lastSeen: number = performance.now();
  id: string = shortGuid();
  constructor() {

  }
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

export const getLowest = <T>(data: Array<T>, fn: (d: T) => number) => {
  const ranked = data.map(d => fn(d));
  let index = -1;
  let score = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < ranked.length; i++) {
    if (ranked[ i ]! < score) {
      score = ranked[ i ]!;
      index = i;
    }
  }
  if (index === -1) return undefined;
  return { data: data[ index ], score };
}

export class PoseMatcher {
  tracked: TrackedPose[] = [];
  distanceThreshold: number;
  ageThreshold: number;
  lastPrune = 0;
  log;

  constructor(opts: PoseMatcherOptions) {
    this.distanceThreshold = opts.distanceThreshold;
    this.ageThreshold = opts.maxAgeMs;
    this.log = new Log(`PoseMatcher`, opts.verbosity);
  }

  *toPoses(poses: Mp.PoseLandmarkerResult) {
    for (let i = 0; i < poses.landmarks.length; i++) {
      yield this.toPose(poses.landmarks[ i ]!, poses.worldLandmarks[ i ]!);
    }
  }


  toPose(n: Mp.NormalizedLandmark[], l: Mp.Landmark[]): PoseData {
    const c = Points.centroid(n[ 12 ], n[ 11 ], n[ 24 ], n[ 23 ]);

    const now = performance.now();
    if (now - this.lastPrune > this.ageThreshold) {
      // Remove dead poses
      let pre = this.tracked.length;
      this.tracked = this.tracked.filter(d => {
        const age = (now - d.lastSeen);
        if (age > this.ageThreshold) return false;
        return true;
      })
      this.lastPrune = now;
      let post = this.tracked.length;
      if (post < pre) {
        this.log.debug(`Pruned: ${ pre - post } expired pose(s)`);
      }
    }
    // Get existing pose with closest distance
    const closest = getLowest(this.tracked, d => Points.distance(d.centroid, c));

    let target: TrackedPose | undefined;
    if (!closest || closest.score > this.distanceThreshold) {
      if (closest) {
        this.log.info(`Closest match exceeds threshold. Score: ${ closest?.score } Threshold: ${ this.distanceThreshold }`);
      } else {
        this.log.info(`No poses`);
      }
      // No existing poses, or it exceeds threshold
      target = new TrackedPose();
      this.tracked.push(target);
    } else {
      target = closest.data!;
    }
    target.lastSeen = now;
    target.centroid = c;
    return {
      poseid: target.id,
      landmarks: n,
      world: l
    }
  }

}

