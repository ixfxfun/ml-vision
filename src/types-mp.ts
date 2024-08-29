// Can't get plain vanilla JS importing types properly
// when we just re-export from Mediapipe. So here they are, copied from MP.

export type NormalizedLandmark = {
  /** The x coordinates of the normalized landmark. */
  x: number;
  /** The y coordinates of the normalized landmark. */
  y: number;
  /** The z coordinates of the normalized landmark. */
  z: number;
  /** The likelihood of the landmark being visible within the image. */
  visibility: number;
}

export type Landmark = {
  /** The x coordinates of the landmark. */
  x: number;
  /** The y coordinates of the landmark. */
  y: number;
  /** The z coordinates of the landmark. */
  z: number;
  /** The likelihood of the landmark being visible within the image. */
  visibility: number;
}

export type Detection = {
  /** A list of `Category` objects. */
  categories: Category[];
  /** The bounding box of the detected objects. */
  boundingBox?: BoundingBox;
  /**
   * List of keypoints associated with the detection. Keypoints represent
   * interesting points related to the detection. For example, the keypoints
   * represent the eye, ear and mouth from face detection model. Or in the
   * template matching detection, e.g. KNIFT, they can represent the feature
   * points for template matching. Contains an empty list if no keypoints are
   * detected.
   */
  keypoints: NormalizedKeypoint[];
}

export type BoundingBox = {
  /** The X coordinate of the top-left corner, in pixels. */
  originX: number;
  /** The Y coordinate of the top-left corner, in pixels. */
  originY: number;
  /** The width of the bounding box, in pixels. */
  width: number;
  /** The height of the bounding box, in pixels. */
  height: number;
  /**
   * Angle of rotation of the original non-rotated box around the top left
   * corner of the original non-rotated box, in clockwise degrees from the
   * horizontal.
   */
  angle: number;
}

export type Category = {
  /** The probability score of this label category. */
  score: number;
  /** The index of the category in the corresponding label file. */
  index: number;
  /**
   * The label of this category object. Defaults to an empty string if there is
   * no category.
   */
  categoryName: string;
  /**
   * The display name of the label, which may be translated for different
   * locales. For example, a label, "apple", may be translated into Spanish for
   * display purpose, so that the `display_name` is "manzana". Defaults to an
   * empty string if there is no display name.
   */
  displayName: string;
}

export type NormalizedKeypoint = {
  /** X in normalized image coordinates. */
  x: number;
  /** Y in normalized image coordinates. */
  y: number;
  /** Optional label of the keypoint. */
  label?: string;
  /** Optional score of the keypoint. */
  score?: number;
}

export type HandLandmarkerResult = {
  /** Hand landmarks of detected hands. */
  landmarks: NormalizedLandmark[][];
  /** Hand landmarks in world coordinates of detected hands. */
  worldLandmarks: Landmark[][];

  /** Handedness of detected hands. */
  handedness: Category[][];
}