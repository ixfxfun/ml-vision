import type { TrackedValueOpts } from "ixfx/trackers.js";
import type { PoseData } from "./index.js";
import { PoseTracker } from "./pose-tracker.js";
import { getLandmarkIndexByName, type PoseLandmarks } from "./landmarks.js";
import { Points } from "ixfx/geometry.js";

export type PosesTrackerOptions = TrackedValueOpts & {
  maxAgeMs: number
}

/**
 * Tracks several poses (ie. bodies)
 * 
 * Events:
 * - expired: Tracked pose has not been seen for a while
 * - added: A new pose id
 */
export class PosesTracker extends EventTarget {
  /** 
   * PoseTrackers, keyed by 'sender-poseid'
   **/
  #data = new Map<string, PoseTracker>();
  #options: PosesTrackerOptions;

  /**
   * Constructor
   * @param {Partial<PosesTrackerOptions>} options 
   */
  constructor(options = {}) {
    super();
    this.#options = {
      maxAgeMs: 10_000,
      sampleLimit: 100,
      storeIntermediate: false,
      ...options
    };
    setInterval(() => {
      // Delete expired poses
      const expired = [ ...this.#data.entries() ].filter(entry => entry[ 1 ].elapsed > this.#options.maxAgeMs);
      for (const entry of expired) {
        this.#data.delete(entry[ 0 ]);

        //this.fireEvent(`expired`, { pose: entry[ 1 ] });
        this.dispatchEvent(new CustomEvent(`expired`, { detail: entry[ 1 ] }));
      }
    }, 1000);
  }

  /**
   * Enumerates each of the PoseTrackers, sorted by age.
   * The most recent pose will be at position 0.
   * (ie. one for each body).
   * Use getRawPosesByAge() to enumerate raw pose data
   */
  *getByAge() {
    const trackers = [ ...this.#data.values() ];
    trackers.sort((a, b) => a.elapsed - b.elapsed);
    yield* trackers.values();
  }

  /**
   * Enumerates PoseTrackers, sorting by the horizontal middle position.
   * Leftmost pose will be at position 0.
   */
  *getByHorizontal() {
    const trackers = [ ...this.#data.values() ];
    trackers.sort((a, b) => a.middle.x - b.middle.x);
    yield* trackers;
  }

  /**
   * Returns poses in order of distance (as judged by their centroid property)
   * from the given point. Since centroid is 2D, distance is also calculated using x,y only.
   * 
   * The point should be the same coordinates as poses.
   * @param point Point to compare to 
   */
  getByDistanceFromPoint(point: Points.Point) {
    const withDistance = [ ...this.#data.values() ].map(pt => {
      return {
        distance: Points.distance2d(pt.centroid(), point),
        tracker: pt
      }
    });
    withDistance.sort((a, b) => {
      return a.distance - b.distance;
    });
    return withDistance;
  }

  /**
   * Returns the closest pose to `point`, as judged by its centroid property
   * @param point 
   * @returns 
   */
  getClosestPoseToPoint(point: Points.Point) {
    const sorted = this.getByDistanceFromPoint(point);
    if (sorted.length === 0) return;
    return sorted[ 0 ].tracker;
  }

  /**
   * Enumerates PoseTrackers, sorting by the vertical middle position.
   * Highest pose will be at position 0.
   */
  *getByVertical() {
    const trackers = [ ...this.#data.values() ];
    trackers.sort((a, b) => a.middle.y - b.middle.y);
    yield* trackers;
  }

  /**
   * Enumerates PoseTrackers, sorting by the average Z value.
   * Closest pose will be at position 0.
   */
  *getByDistance() {
    const trackers = [ ...this.#data.values() ];
    trackers.sort((a, b) => {
      const az = a.zRange ? a.zRange.avg : 0;
      const bz = b.zRange ? b.zRange.avg : 0;
      return az - bz;
    });
    yield* trackers;
  }

  /**
   * Enumerate all PoseTracker instances
   */
  *get() {
    const trackers = [ ...this.#data.values() ];
    yield* trackers.values();
  }

  /**
   * Enumerate the last set of raw pose data for
   * each of the PoseTrackers.
   */
  *getRawPosesByAge() {
    for (const tracker of this.getByAge()) {
      yield tracker.last;
    }
  }

  *getRawPoses(): Generator<PoseData> {
    const values = [ ...this.#data.values() ];
    for (const tracker of values) {
      const last = tracker.last;
      if (!last) continue;
      yield last;
    }

  }

  /**
   * Get a raw landmark by name across all poses
   * 
   * @example Get the 'nose' landmark for all bodies
   * ````js
   * for (const n of poses.landmarkValues(`nose`)) {
   *  // Yields: { x, y, z?, score, name }
   * }
   * ```
   * 
   * @param namesOrIds Name or index of landmark to get data for
   */
  *landmarkValues(...namesOrIds: (PoseLandmarks | number)[]) {
    for (const pose of this.get()) {
      yield* pose.landmarkValues(...namesOrIds);
    }
  }

  /**
   * Enumerates all [PointTrackers](https://api.ixfx.fun/classes/Trackers.PointTracker) for a given landmark id.
   * 
   * ```js
   * // Return all landmarks for all poses
   * for (const pt of poses.landmarks()) {
   * }
   * ```
   * 
   * eg. to get the PointTracker for 'nose' across all poses currently seen:
   * 
   * ```js
   * for (const pt of poses.landmarks(`nose`)) {
   *  // do something with tracker...
   * }
   * ```
   * 
   * @param namesOrIds List of indexes or landmark names to filter by
   */
  *landmarks(...namesOrIds: (PoseLandmarks | number)[]) {
    for (const tracker of this.get()) {
      yield* tracker.landmarks(...namesOrIds);
    }
  }


  /**
   * Returns all [PointTrackers](https://api.ixfx.fun/classes/Trackers.PointTracker) from a particular sender
   * 
   * ```js
   * for (const pt of poses.getFromSender(`mobile`)) {
   *  // Do something with tracker...
   * }
   * ```
   * 
   * @param senderId Id of sender
   */
  *getFromSender(senderId: string) {
    const values = [ ...this.#data.values() ];
    for (const tracker of values) {
      if (tracker.fromId === senderId) yield tracker;
    }
  }


  /**
   * Enumerate the set of unique sender ids
   * ```js
   * for (const sender of poses.getSenderIds()) {
   *  // Do something with sender (string)
   * }
   * ```
   */
  *getSenderIds() {
    const set = new Set();
    const values = [ ...this.#data.values() ];
    for (const entry of values) {
      set.add(entry.fromId);
    }
    yield* set.values();
  }

  /**
   * Returns the PoseTracker for this pose id.
   * 
   * ```js
   * const pose = poses.getByPoseId(`123`);
   * pose.middle; // { x, y }
   * ```
   * 
   * Warning: Pose ids are not unique if there are multiple data sources.
   * Prefer using guids.
   * 
   * @param id Id of pose
   */
  getByPoseId(id: string) {
    for (const entry of this.#data.values()) {
      if (entry.poseId === id) return entry;
    }
  }

  /**
   * Returns the last raw pose data for this pose id.
   * 
   * ```js
   * const pose = poses.getRawPoseByPoseId(`123`);
   * pose.landmark; // array of landmarks { x, y, z?, score, name }
   * pose.score; // score of this pose
   * pose.box;  // bounding box
   * ```
   * 
   * Warning: Pose ids are not unique if there are multiple data sources.
   * Prefer using guids.
   * 
   * @param id Id of pose
   */
  getRawPoseByPoseId(id: string) {
    for (const entry of this.#data.values()) {
      if (entry.poseId === id) return entry.last;
    }
  }

  /**
   * Enumerate the set of globally-unique ids of poses
   */
  *getGuids() {
    for (const t of this.#data.values()) {
      yield t.guid;
    }
  }

  /**
   * Get the PoseTracker for unique id (based on sender and pose)
   * ```js
   * const pt = poses.getByGuid(`123-123`);
   * pt.middle; // { x, y }
   * ```
   * 
   * Alternatively: {@link getRawPoseByGuid} to get raw data
   * @param guid Combined id of sender-poseid
   */
  getByGuid(guid: string | undefined) {
    if (!guid) return;
    return this.#data.get(guid);
  }

  /**
   * Returns _true_ if a PoseTracker for `guid` is found.
   * @param guid 
   */
  hasPoseGuid(guid: string | undefined) {
    if (!guid) return false;
    return this.#data.has(guid);
  }



  /**
   * Returns the raw pose data for a unique id
   * ```js
   * const pose = poses.getRawPoseByGuide(`123-123`);
   * pose.landmark; // array of { x, y, z?, score, name }
   * pose.score;     // score of pose
   * ```
   * 
   * Alternatively: {@link getByGuid} to get a tracker for pose
   * @param guid Combined sender-pose
   * @returns 
   */
  getRawPoseByGuid(guid: string) {
    return this.#data.get(guid)?.last;
  }

  /**
   * Track a pose.
   * Fires `added` event if it is a new pose.
   * Returns the globally-unique id for this pose
   * @param pose New pose data
   * @param from Sender id
   */
  seen(from: string, pose: PoseData) {
    if (from === undefined) throw new Error(`Param 'from' is undefined`);
    if (pose === undefined) throw new Error(`Param 'pose' is undefined`);

    // Construct globally-unique id for this pose
    const id = (pose.poseid ?? 0).toString();
    const nsId = from + `-` + id;

    // Does it exist already?
    let tp = this.#data.get(nsId);

    // Nope, make a new PoseTracker
    if (tp === undefined) {
      tp = new PoseTracker(from, id, this.#options);
      this.#data.set(nsId, tp);
      tp.seen(pose);
      //this.fireEvent(`added`, { pose: tp });
      this.dispatchEvent(new CustomEvent(`added`, { detail: tp }));
    } else {
      // Got it, update with latest pose
      tp.seen(pose);
    }
    return nsId;
  }

  /**
   * Return number of tracked poses
   */
  get size() {
    return this.#data.size;
  }

  /**
   * Clear all data
   */
  clear() {
    this.#data.clear();
  }

}
