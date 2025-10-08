import { Points, PointsTracker, PointTracker, Rects, type Point, type RectPositioned } from 'ixfx/geometry.js';
import type { PoseData } from './index.js';
import { getLandmarkNameByIndex, type PoseLandmarks } from './landmarks.js';
import { centroid } from './geometry.js';
import type { TrackedValueOpts } from 'ixfx/trackers.js';
import * as Arrays from 'ixfx/arrays.js';
import { numberArrayCompute, type NumbersComputeResult } from 'ixfx/numbers.js';
import { type Landmark, type NormalizedLandmark } from '../../types-mp.js';

export type { TrackedValueOpts }
/**
 * PoseTracker keeps track of a landmarks for a single pose. 
 * This is useful for tracking the movement of a pose or its landmarks over time.
 * It does this by making a PointTracker for each keypoint of a pose.
 * 
 * Note: You probably don't want to create this yourself! Rather, use a {@link PosesTracker} to access.
 * 
 * @example
 * ```js
 * // Create a tracker (fromId is the id of sender, poseId is the id of the pose)
 * const pt = new PoseTracker(fromId, poseId, options);
 * // ...and whenever there is data, call .seen()
 * pt.seen(pose);
 * ```
 * 
 * When creating, the most useful tuning options are `sampleLimit` which governs
 * how many of the most recent samples to keep, and `storeIntermediate` (true/false)
 * to store intermediate data.
 * 
 * ## Accessing keypoints
 *  You can get the raw keypoint data from the pose
 * ```js
 * // Get a single point
 * const nosePoint = pose.landmarkValue(`nose`); // { x, y, score, name }
 * // Get all points
 * for (const kp of poses.landmarkValues()) {
 * // { x, y, score, name }
 * }
 * ```
 * But the real power comes from getting the [PointTracker](https://api.ixfx.fun/_ixfx/geometry/PointTracker/) for a keypoint, since it keeps track of not just the last data, but a whole trail of historical data for a given keypoint.
 * ```js
 * const noseTracker = pose.landmark(`nose`); // PointTracker
 * ```
 * Once we have the PointTracker, there are a _lot_ of things to access:
 * 
 */
export class PoseTracker {
  #fromId;
  #poseId;
  #guid;
  #seen = 0;
  #boxNormalised: RectPositioned | undefined;
  #boxWorld: RectPositioned | undefined;
  #data: PoseData | undefined;
  #normalisedLandmarks: PointsTracker<NormalizedLandmark>;
  #worldLandmarks: PointsTracker<Landmark>;
  #hue: number;
  #zNormalisedRange: NumbersComputeResult = { count: 0, min: 0, max: 0, avg: 0, total: 0 }
  #zWorldRange: NumbersComputeResult = { count: 0, min: 0, max: 0, avg: 0, total: 0 }

  /**
   * Creates a PoseTracker
   * 
   * Defaults:
   * * sampleLimit: 10
   * * storeIntermediate: false
   * @param fromId Data source for pose (ie device)
   * @param poseId Id of pose from TFjs
   * @param options 
   */
  constructor(fromId: string, poseId: string, options: TrackedValueOpts = {}) {
    this.#poseId = poseId;
    this.#fromId = fromId;
    this.#guid = fromId + `-` + poseId;
    this.#hue = Math.random() * 360;
    const opts: TrackedValueOpts = {
      id: poseId,
      debug: options.debug ?? false,
      sampleLimit: 10,
      storeIntermediate: false,
      ...options
    }
    this.#normalisedLandmarks = new PointsTracker<NormalizedLandmark>(opts);
    this.#worldLandmarks = new PointsTracker<Landmark>(opts);
  }

  /**
   * Reset stored data for the tracker
   */
  reset() {
    this.#normalisedLandmarks.reset();
    this.#worldLandmarks.reset();
  }

  /**
   * Returns a [PointTracker](https://api.ixfx.fun/_ixfx/geometry/PointTracker/) for a given
   * normalised landmark by name or index.
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
  landmark(nameOrIndex: PoseLandmarks | number): PointTracker<NormalizedLandmark> | undefined {
    if (nameOrIndex === undefined) throw new TypeError(`Param 'nameOrIndex' is undefined. Expected landmark name or numerical index`);
    if (typeof nameOrIndex === `number`) {
      return this.#normalisedLandmarks.get(getLandmarkNameByIndex(nameOrIndex)) as PointTracker<NormalizedLandmark> | undefined;
    } else {
      return this.#normalisedLandmarks.get(nameOrIndex) as PointTracker<NormalizedLandmark> | undefined;
    }
  }

  /**
 * Returns a [PointTracker](https://api.ixfx.fun/_ixfx/geometry/PointTracker/) for a given
 * normalised landmark by name or index.
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
  worldLandmark(nameOrIndex: PoseLandmarks | number): PointTracker<Landmark> | undefined {
    if (nameOrIndex === undefined) throw new TypeError(`Param 'nameOrIndex' is undefined. Expected landmark name or numerical index`);
    if (typeof nameOrIndex === `number`) {
      return this.#worldLandmarks.get(getLandmarkNameByIndex(nameOrIndex)) as PointTracker<Landmark> | undefined;
    } else {
      return this.#worldLandmarks.get(nameOrIndex) as PointTracker<Landmark> | undefined;
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
  landmarkValue(nameOrIndex: PoseLandmarks | number): NormalizedLandmark {
    if (nameOrIndex === undefined) throw new TypeError(`Param 'nameOrIndex' is undefined. Expected landmark name or numerical index`);
    const name = typeof nameOrIndex === `string` ? nameOrIndex : getLandmarkNameByIndex(nameOrIndex);
    const t = this.#normalisedLandmarks.get(name);
    if (t === undefined) throw new Error(`Point '${ name }' is not tracked`);
    const pt = t.last;
    if (pt === undefined) throw new Error(`No data for point '${ name }'`);
    return pt;
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
  worldLandmarkValue(nameOrIndex: PoseLandmarks | number): Landmark {
    if (nameOrIndex === undefined) throw new TypeError(`Param 'nameOrIndex' is undefined. Expected landmark name or numerical index`);
    const name = typeof nameOrIndex === `string` ? nameOrIndex : getLandmarkNameByIndex(nameOrIndex);
    const t = this.#worldLandmarks.get(name);
    if (t === undefined) throw new Error(`Point '${ name }' is not tracked`);
    const pt = t.last;
    if (pt === undefined) throw new Error(`No data for point '${ name }'`);
    return pt;
  }


  /**
   * Update this pose with new information
   * @param pose 
   */
  seen(pose: PoseData) {
    this.#seen = Date.now();
    this.#data = pose;
    let zNormalisedValues: number[] = [];
    let zWorldValues: number[] = [];

    for (let i = 0; i < pose.landmarks.length; i++) {
      const lm = pose.landmarks[ i ];
      zNormalisedValues.push(lm.z);
      const name = getLandmarkNameByIndex(i);
      this.#normalisedLandmarks.seen(name, lm);
    }

    for (let i = 0; i < pose.world.length; i++) {
      const lm = pose.landmarks[ i ];
      zWorldValues.push(lm.z);
      const name = getLandmarkNameByIndex(i);
      this.#worldLandmarks.seen(name, lm);
    }

    this.#zNormalisedRange = numberArrayCompute(zNormalisedValues);
    this.#zWorldRange = numberArrayCompute(zWorldValues);
  }

  /**
   * Returns all the [PointTrackers](https://api.ixfx.fun/_ixfx/geometry/PointTracker/) (ie. landmark) for this pose.
   * 
   * ```js
   * for (const pt of pose.landmarks()) {
   *  // Do something with 'pt' (which tracks one individual landmark)
   * }
   * ```
   * 
   * Or provide a list of landmark indexes or name:
   * ```js
   * // Get landmarks for right arm
   * for (const pt of pose.landmarks(11, 13, 15)) {
   * }
   * ```
   */
  *landmarks(...namesOrIds: (PoseLandmarks | number)[]) {
    if (namesOrIds.length > 0) {
      for (const ni of namesOrIds) {
        const l = this.landmark(ni);
        if (l) yield l;
      }
    } else {
      yield* this.#worldLandmarks.store.values();
    }
  }

  *worldLandmarks(...namesOrIds: (PoseLandmarks | number)[]) {
    if (namesOrIds.length > 0) {
      for (const ni of namesOrIds) {
        const l = this.worldLandmark(ni);
        if (l) yield l;
      }
    } else {
      yield* this.#worldLandmarks.store.values();
    }
  }

  /**
   * Returns the raw landmarks
   * 
   * ```js
   * for (const kp of pose.landmarkValues()) {
   *  // { x, y, z?, score, name }
   * }
   * ```
   */
  *landmarkValues(...namesOrIds: (PoseLandmarks | number)[]) {
    if (namesOrIds.length > 0) {
      for (const ni of namesOrIds) {
        const pt = this.landmark(ni);
        if (pt) yield pt.last;
      }
    } else {
      for (const v of this.#normalisedLandmarks.store.values()) {
        yield v.last;
      }
    }
  }

  *worldLandmarkValues(...namesOrIds: (PoseLandmarks | number)[]) {
    if (namesOrIds.length > 0) {
      for (const ni of namesOrIds) {
        const pt = this.landmark(ni);
        if (pt) yield pt.last;
      }
    } else {
      for (const v of this.#worldLandmarks.store.values()) {
        yield v.last;
      }
    }
  }

  /**
   * Returns the centroid of all the pose points (uses normalised landmarks)
   * ```js
   * pose.centroid(); // { x, y }
   * ```
   * 
   * Or you can pass in the names/indexes of landmarks:
   * ```js
   * pose.centroid(`left_shoulder`, `right_shoulder`);
   * ```
   * 
   * Returns `{ x: 0.5, y: 0.5 }` is data is missing
   */
  centroid(...namesOrIds: (PoseLandmarks | number)[]) {
    if (!this.#data) return { x: 0.5, y: 0.5 };
    if (namesOrIds.length === 0) {
      return centroid(this.#data);
    } else {
      const pts = [ ...this.landmarkValues(...namesOrIds) ];
      return Points.centroid(...pts);
    }
  }

  /**
   * Returns PointTrackers, sorted by their last X value
   * @param namesOrIds 
   * @returns 
   */
  getSortedByX(...namesOrIds: (PoseLandmarks | number)[]) {
    const lm = [ ...this.landmarks(...namesOrIds) ];
    if (lm.length === 0) throw new Error(`No landmarks found per filter`);
    return Arrays.sortByNumericProperty(lm, `x`);
  }

  /**
   * Gets the leftmost (by camera frame coords) of any of the listed landmarks
   * 
   * Eg get whichever wrist is the most left of the camera frame
   * ```js
   * pose.getLeftmost(`left_wrist`,`right_wrist`);
   * ```
   * @param namesOrIds 
   * @returns 
   */
  getLeftmost(...namesOrIds: (PoseLandmarks | number)[]) {
    const s = this.getSortedByX(...namesOrIds);
    if (s.length === 0) throw new Error(`No landmarks found per filter`);

    return s[ 0 ];
  }

  /**
   * Gets the rightmost (by camera frame coords) of any of the listed landmarks
   * 
   * Eg get whichever wrist is the most right of the camera frame
   * ```js
   * pose.getRightmost(`left_wrist`,`right_wrist`);
   * ```
   * @param namesOrIds 
   * @returns 
   */
  getRightmost(...namesOrIds: (PoseLandmarks | number)[]) {
    const s = this.getSortedByX(...namesOrIds);
    if (s.length === 0) throw new Error(`No landmarks found per filter`);

    return s[ s.length - 1 ];
  }

  /**
   * Gets the highest (by camera frame coords) of any of the listed landmarks
   * 
   * Eg get whichever wrist is the highest in the camera frame
   * ```js
   * pose.getHighest(`left_wrist`,`right_wrist`);
   * ```
   * @param namesOrIds 
   * @returns 
   */
  getHighest(...namesOrIds: (PoseLandmarks | number)[]) {
    const s = this.getSortedByY(...namesOrIds);
    if (s.length === 0) throw new Error(`No landmarks found per filter`);

    return s[ 0 ];
  }

  /**
   * Returns landmarks in order of distance from the given point.
   * 
   * The point should be the same coordinates as poses.
   * @param guid 
   */
  getByDistanceFromPoint(point: Points.Point) {
    const withDistance = [ ...this.landmarks() ].map(lm => {
      return {
        distance: Points.distance(lm.last, point),
        landmark: lm,
        raw: lm.last as NormalizedLandmark
      }
    });
    withDistance.sort((a, b) => {
      return a.distance - b.distance;
    });
    return withDistance;
  }

  /**
   * Returns the closest landmark to `point`
   * @param point 
   * @returns 
   */
  getClosestLandmarkToPoint(point: Points.Point) {
    const sorted = this.getByDistanceFromPoint(point);
    if (sorted.length === 0) return;
    return sorted[ 0 ].landmark;
  }

  /**
   * Gets the lowest (by camera frame coords) of any of the listed landmarks
   * 
   * Eg get whichever wrist is the lowest in the camera frame
   * ```js
   * pose.getLowest(`left_wrist`,`right_wrist`);
   * ```
   * @param namesOrIds 
   * @returns 
   */
  getLowest(...namesOrIds: (PoseLandmarks | number)[]) {
    const s = this.getSortedByX(...namesOrIds);
    if (s.length === 0) throw new Error(`No landmarks found per filter`);

    return s[ s.length - 1 ];
  }


  /**
   * Gets the nearest (by camera frame coords) of any of the listed landmarks
   * 
   * Eg get whichever wrist is the nearest in the camera frame
   * ```js
   * pose.getNearest(`left_wrist`,`right_wrist`);
   * ```
   * @param namesOrIds 
   * @returns 
   */
  getNearest(...namesOrIds: (PoseLandmarks | number)[]) {
    const s = this.getSortedByZ(...namesOrIds);
    if (s.length === 0) throw new Error(`No landmarks found per filter`);

    return s[ 0 ];
  }

  /**
   * Gets the furtherest (by camera frame coords) of any of the listed landmarks
   * 
   * Eg get whichever wrist is the furtherest in the camera frame
   * ```js
   * pose.getFurtherest(`left_wrist`,`right_wrist`);
   * ```
   * @param namesOrIds 
   * @returns 
   */
  getFurtherest(...namesOrIds: (PoseLandmarks | number)[]) {
    const s = this.getSortedByZ(...namesOrIds);
    if (s.length === 0) throw new Error(`No landmarks found per filter`);
    return s[ s.length - 1 ];
  }

  /**
   * Returns PointTrackers, sorted by their last Y value
   * @param namesOrIds 
   * @returns 
   */
  getSortedByY(...namesOrIds: (PoseLandmarks | number)[]) {
    const lm = [ ...this.landmarks(...namesOrIds) ];
    if (lm.length === 0) throw new Error(`No landmarks found per filter`);

    return Arrays.sortByNumericProperty(lm, `y`);
  }

  /**
   * Returns PointTrackers, sorted by their last Z value
   * @param namesOrIds 
   * @returns 
   */
  getSortedByZ(...namesOrIds: (PoseLandmarks | number)[]) {
    const lm = [ ...this.landmarks(...namesOrIds) ];
    if (lm.length === 0) throw new Error(`No landmarks found per filter`);

    return Arrays.sortByNumericProperty(lm, `z`);
  }

  /**
   * Gets the bounding box of the pose, computed using the normalised landmarks.
   * ```js
   * pose.box(); // { x, y, width, height }
   * ````
   * 
   * Returns an empty rectangle if there's no data.
   * 
   * You can also provide a list of landmark names/indexes to compute the bounding box
   * for just those:
   * 
   * ```js
   * // Get bounding box of torso
   * pose.box(`left_shoulder`, `right_shoulder`, `left_hip`, `right_`hip`);
   * ```
   * 
   * See also {@link boxWorld} for same behaviour but using world coordinates.
   */
  box(...namesOrIds: (PoseLandmarks | number)[]) {
    if (!this.#data) return Rects.EmptyPositioned;

    if (namesOrIds.length === 0) {
      if (this.#boxNormalised) return this.#boxNormalised;
      this.#boxNormalised = Points.bbox(...this.#data.landmarks);
      return this.#boxNormalised;
    } else {
      return Points.bbox(...this.landmarkValues(...namesOrIds));
    }
  }

  boxWorld(...namesOrIds: (PoseLandmarks | number)[]) {
    if (!this.#data) return Rects.EmptyPositioned;

    if (namesOrIds.length === 0) {
      if (this.#boxWorld) return this.#boxWorld;
      this.#boxWorld = Points.bbox(...this.#data.world);
      return this.#boxWorld;
    } else {
      return Points.bbox(...this.worldLandmarkValues(...namesOrIds));
    }
  }

  /**
   * Returns height of bounding box (normalised coordinates)
   */
  get height() {
    return this.box().height;
  }

  get heightWorld() {
    return this.boxWorld().height;
  }

  /**
   * Return width of bounding box (normalised coordinates)
   */
  get width() {
    return this.box().width;
  }

  get widthWorld() {
    return this.boxWorld().width;
  }

  /**
   * Returns the id of the sender
   */
  get peerId() {
    return this.#fromId;
  }

  /**
   * Returns the middle of the pose bounding box using normalised coordinates
   * ```js
   * pose.middle; // { x, y }
   * ```
   * @returns 
   */
  get middle() {
    const box = this.box();
    if (Rects.isEmpty(box)) return Points.Empty;
    return Rects.center(box);
  }

  get middleWorld() {
    const box = this.boxWorld();
    if (Rects.isEmpty(box)) return Points.Empty;
    return Rects.center(box);
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
   * Gets the min/max Z range of all landmarks (normalised)
   */
  get zRange() {
    return this.#zNormalisedRange;
  }

  /**
   * Gets the min/max Z range of all landmarks (world coordinates)
   */
  get zRangeWorld() {
    return this.#zWorldRange;
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