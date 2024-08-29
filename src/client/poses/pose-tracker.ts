import { PointTracker, TrackedPointMap, points as pointsTracker, type TrackedValueOpts } from 'ixfx/trackers.js';
import { Points, Rects, type Point, type RectPositioned } from 'ixfx/geometry.js';
import type { PoseData } from './index.js';
import { getLandmarkNameByIndex, type PoseLandmarks } from './landmarks.js';
import { centroid } from './geometry.js';

/**
 * Tracks landmarks over time for a single pose (ie. body).
 * 
 * It's important to call .seen() with pose data.
 */
export class PoseTracker {
  #fromId;
  #poseId;
  #guid;
  #seen = 0;
  #box: RectPositioned | undefined;
  #data: PoseData | undefined;
  points: TrackedPointMap;
  #hue: number;

  /**
   * Creates a PoseTracker
   * @param fromId Data source for pose (ie device)
   * @param poseId Id of pose from TFjs
   * @param options 
   */
  constructor(fromId: string, poseId: string, options: TrackedValueOpts) {
    this.#poseId = poseId;
    this.#fromId = fromId;
    this.#guid = fromId + `-` + poseId;
    this.#hue = Math.random() * 360;
    this.points = pointsTracker({ id: poseId, ...options });
  }

  /**
   * Reset stored data for the tracker
   */
  reset() {
    this.points.reset();
  }

  /**
   * Returns a [PointTracker](https://api.ixfx.fun/classes/Trackers.PointTracker) for a given landmark
   * by name or index.
   * 
   * ```js
   * // Eg. get tracker for the 'nose' landmark
   * const nose = pose.landmark(`nose`);
   * 
   * // Get the angle of nose movement since the start
   * const a = nose.angleFromStart();
   * 
   * // Get the distance of nose since start
   * const d = nose.distanceFromStart();
   * ```
   * @param nameOrIndex 
   * @returns 
   */
  landmark(nameOrIndex: PoseLandmarks | number) {
    if (nameOrIndex === undefined) throw new TypeError(`Param 'nameOrIndex' is undefined. Expected landmark name or numerical index`);
    if (typeof nameOrIndex === `number`) {
      return this.points.get(getLandmarkNameByIndex(nameOrIndex));
    } else {
      return this.points.get(nameOrIndex);
    }
  }

  /**
   * Returns the last position for a given landmark.
   * ```js
   * const pos = pose.landmarkValue(`nose`); // { x, y }
   * ```
   * 
   * Throws an error if `nameOrIndex` does not exist.
   * @param nameOrIndex
   * @returns 
   */
  landmarkValue(nameOrIndex: PoseLandmarks | number) {
    if (nameOrIndex === undefined) throw new TypeError(`Param 'nameOrIndex' is undefined. Expected landmark name or numerical index`);
    const name = typeof nameOrIndex === `string` ? nameOrIndex : getLandmarkNameByIndex(nameOrIndex);
    const t = this.points.get(name);
    if (t === undefined) throw new Error(`Point '${ name }' is not tracked`);
    const pt = t.last;
    if (pt === undefined) throw new Error(`No data for point '${ name }'`);
    return pt;
  }

  /**
   * Update this pose with new information
   * @param pose 
   */
  async seen(pose: PoseData) {
    this.#seen = Date.now();
    this.#data = pose;

    for (let i = 0; i < pose.landmarks.length; i++) {
      const lm = pose.landmarks[ i ];
      const name = getLandmarkNameByIndex(i);
      await this.points.seen(name, lm);
    }
  }

  /**
   * Returns all the [PointTrackers](https://api.ixfx.fun/classes/Trackers.PointTracker) (ie. landmark) for this pose.
   * 
   * ```js
   * for (const pt of pose.getPointTrackers()) {
   *  // Do something with 'pt' (which tracks one individual landmark)
   * }
   * ```
   */
  *getPointTrackers() {
    yield* this.points.store.values();
  }

  /**
   * Returns the raw landmarks
   * 
   * ```js
   * for (const kp of pose.getRawValues()) {
   *  // { x, y, z?, score, name }
   * }
   * ```
   * @returns {Point>}
   */
  *getRawValues() {
    for (const v of this.points.store.values()) {
      yield v.last;
    }
  }

  /**
   * Returns the centroid of all the pose points
   * ```js
   * pose.centroid; // { x, y }
   * ```
   * 
   * Returns {0.5,0.5} is data is missing
   */
  get centroid() {
    if (!this.#data) return { x: 0.5, y: 0.5 };
    return centroid(this.#data);
  }

  /**
   * Returns height of bounding box
   */
  get height() {
    return this.box.height;
  }

  /**
   * Return width of bounding box
   */
  get width() {
    return this.box.width;
  }


  /**
   * Gets the bounding box of the pose, computed by 'landmarks'.
   * ```js
   * pose.box; // { x, y, width, height }
   * ````
   * 
   * Returns an empty rectangle if there's no data
   */
  get box() {
    if (this.#box) return this.#box;
    if (!this.#data) return Rects.EmptyPositioned;
    this.#box = Points.bbox(...this.#data.landmarks);
    return this.#box;
  }

  /**
   * Returns the id of the sender
   */
  get peerId() {
    return this.#fromId;
  }

  /**
   * Returns the middle of the pose bounding box
   * ```js
   * pose.middle; // { x, y }
   * ```
   * @returns 
   */
  get middle() {
    const box = this.box;
    if (box) {
      return {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
      };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Returns the randomly-assigned hue (0..360)
   */
  get hue() {
    return this.#hue;
  }

  /**
   * Returns a CSS colour: hsl() based on
   * the randomly-assigned hue
   */
  get hsl() {
    return `hsl(${ this.#hue }, 70%, 50%)`;
  }

  /**
   * Returns the globally unique id of this pose
   * (fromId-poseId)
   */
  get guid() {
    return this.#guid;
  }

  /**
   * Returns the original pose id from TFjs
   * Warning: this may not be unique if there are multiple senders
   */
  get poseId() {
    return this.#poseId;
  }
  /**
   * Returns the id of the sender of this pose
   */
  get fromId() {
    return this.#fromId;
  }


  /**
   * Returns how long since pose was updated
   */
  get elapsed() {
    return Date.now() - this.#seen;
  }

  /**
   * Returns the last pose data in raw format
   */
  get last() {
    return this.#data;
  }
}