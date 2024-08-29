import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import * as D from '../util/drawing.js';
import { type NormalizedLandmark, type Detection, type HandLandmarkerResult, type BoundingBox } from '@mediapipe/tasks-vision';
import type { PoseData } from '../types.js';
import { expiringMap } from 'ixfx/maps.js';
import { Colour } from 'ixfx/visual.js';
import type { ProcessorModes } from '../processor-modes.js';

@customElement('overlay-element')

export class OverlayElement extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
  `;

  canvasEl: Ref<HTMLCanvasElement> = createRef();
  #colours = expiringMap<string, string>({
    autoDeleteElapsedMs: 1000,
    autoDeletePolicy: `get`,
  });
  lastHue = 100;

  labelPoints = true;

  override render() {
    return html`
      <canvas ${ ref(this.canvasEl) }></canvas>
    `;
  }

  setSize(width: number, height: number) {
    const el = this.canvasEl.value;
    if (!el) return;
    el.width = width;
    el.height = height;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  draw(mode: ProcessorModes, data?: any) {
    const el = this.canvasEl.value;
    if (!el) return;

    const wrap = D.wrap(el);
    wrap.clear();

    if (!data) return;

    switch (mode) {
      case `hand`: {
        this.drawHands(wrap, data as HandLandmarkerResult);
        break;
      }
      case `objects`: {
        this.drawObjects(wrap, data.detections);
        break;
      }
      case `pose`: {
        for (const d of data) {
          if (`poseid` in d) {
            const pose = d as PoseData;
            this.drawPose(wrap, pose);

          }
        }
        this.drawLandmarks(wrap, data.landmarks);
        break;
      }
      case `face`: {
        this.drawFaces(wrap, data.detections);
        break;
      }
    }
  }


  drawFaces(wrap: D.Wrapper, d: Detection[]) {
    for (let i = 0; i < d.length; i++) {
      const bbox = d[ i ].boundingBox;
      const colour = Colour.goldenAngleColour(i);
      for (let k = 0; k < d[ i ].keypoints.length; k++) {
        const label = this.labelPoints ? k.toString() : ``;
        wrap.dot(d[ i ].keypoints[ k ], 0.01, colour, label);
      }

    }
  }

  drawHands(wrap: D.Wrapper, results: HandLandmarkerResult) {
    let index = 0;
    for (const hand of results.landmarks) {
      const colour = Colour.goldenAngleColour(index);
      this.drawHand(wrap, hand, colour);
      this.drawOneSetOfLandmarks(wrap, hand, 0.02, colour);

      index++;
    }
  }

  drawHand(wrap: D.Wrapper, p: NormalizedLandmark[], colour: string) {
    const width = 0.01;
    wrap.ctx.strokeStyle = colour;
    wrap.joinPoints(width, p[ 0 ], p[ 1 ], p[ 2 ], p[ 3 ], p[ 4 ]);
    wrap.joinPoints(width, p[ 5 ], p[ 6 ], p[ 7 ], p[ 8 ]);
    wrap.joinPoints(width, p[ 9 ], p[ 10 ], p[ 11 ], p[ 12 ]);
    wrap.joinPoints(width, p[ 13 ], p[ 14 ], p[ 15 ], p[ 16 ]);
    wrap.joinPoints(width, p[ 17 ], p[ 18 ], p[ 19 ], p[ 20 ]);
    wrap.joinPoints(width, p[ 5 ], p[ 9 ], p[ 13 ], p[ 17 ], p[ 0 ], p[ 5 ]);
  }

  drawObjects(wrap: D.Wrapper, data: Detection[]) {
    const typewriter = D.typewriter(wrap.ctx, 10, 100);

    let index = 0;
    for (const d of data) {
      // Object detection
      const colour = Colour.goldenAngleColour(index);
      this.drawDetectionBoundingBox(wrap, d as Detection, colour, typewriter);
      index++;
    }
  }

  drawDetectionBoundingBox(wrap: D.Wrapper, det: Detection, colour: string, typewriter: D.Typewriter) {
    const ctx = wrap.ctx;
    const bbox = det.boundingBox;
    if (bbox) {
      this.drawBoundingBox(ctx, bbox, colour)
    }
    if (det.categories) {
      for (const c of det.categories) {
        typewriter.line(`${ c.score.toPrecision(2) } - ${ c.categoryName }`, colour);
      }
    }
  }

  drawBoundingBox(ctx: CanvasRenderingContext2D, bbox: BoundingBox, colour: string) {
    ctx.save();
    ctx.translate(bbox.originX, bbox.originY);
    ctx.rotate(bbox.angle);
    ctx.lineWidth = 5;
    ctx.strokeStyle = colour;
    ctx.strokeRect(0, 0, bbox.width, bbox.height);
    ctx.restore();
  }

  getColour(id: string) {
    let colour = this.#colours.get(id);
    this.#colours.touch(id);
    if (!colour) {
      this.lastHue += (45 * Math.random());
      if (this.lastHue > 360) this.lastHue = this.lastHue % 360;
      colour = `hsl(${ this.lastHue }deg, 50%, 50%)`;
      this.#colours.set(id, colour);
    }
    return colour;
  }

  drawLandmarks(wrap: D.Wrapper, poses: NormalizedLandmark[][]) {
    if (!poses) return;
    let index = 0;
    for (const p of poses) {
      this.drawOneSetOfLandmarks(wrap, p, 0.01, this.getColour(index.toString()));
      index++;
    }
  }

  drawOneSetOfLandmarks(wrap: D.Wrapper, p: NormalizedLandmark[], maxRadius: number, colour: string) {
    let index = 0;
    for (const l of p) {
      let z = -1 * l.z; // Invert so closer is toward 1
      const r = Math.min(maxRadius * 3, Math.max(0.0001, maxRadius + (maxRadius * z * 3)));
      const label = this.labelPoints ? index.toString() : ``;
      wrap.dot(l, r, colour, label);
      index++;
    }
  }

  drawPose(wrap: D.Wrapper, pose: PoseData) {
    const colour = this.getColour(pose.poseid);
    this.drawPoseLines(wrap, pose.landmarks, colour);
    if (this.labelPoints) {
      this.drawOneSetOfLandmarks(wrap, pose.landmarks, 0.002, colour)
    }
  }

  drawPoseLines(wrap: D.Wrapper, p: NormalizedLandmark[], colour: string) {
    let index = 0;
    const width = 0.01;
    wrap.ctx.strokeStyle = colour;

    // Left side
    wrap.joinPoints(width, p[ 32 ], p[ 30 ], p[ 28 ], p[ 26 ], p[ 24 ], p[ 12 ], p[ 14 ], p[ 16 ], p[ 18 ], p[ 20 ], p[ 16 ], p[ 22 ])
    // Right side
    wrap.joinPoints(width, p[ 31 ], p[ 29 ], p[ 27 ], p[ 25 ], p[ 23 ], p[ 11 ], p[ 13 ], p[ 15 ], p[ 17 ], p[ 19 ], p[ 15 ], p[ 21 ])

    // Shoulders
    wrap.joinPoints(width, p[ 12 ], p[ 11 ]);

    // Hips
    wrap.joinPoints(width, p[ 24 ], p[ 23 ]);

    // Mouth
    wrap.joinPoints(width, p[ 10 ], p[ 9 ]);

    // Eyes
    wrap.joinPoints(width, p[ 8 ], p[ 6 ], p[ 5 ], p[ 4 ], p[ 0 ], p[ 1 ], p[ 2 ], p[ 3 ], p[ 7 ])
  }
}

declare global {
  interface HTMLElementTagNameMap {
    // @ts-ignore
    'overlay-element': OverlayElement;
  }
}
