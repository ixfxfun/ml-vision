import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { SourceSelector } from './source-selector.js';
import type { RecordingData, SourceData } from '../types.js';
import { OverlayElement } from './pose-overlay.js';

@customElement('ml-vision')
export class MlVision extends LitElement {
  sourceSelectorEl: Ref<SourceSelector> = createRef();
  videoEl: Ref<HTMLVideoElement> = createRef();
  overlayEl: Ref<OverlayElement> = createRef();
  contentsEl: Ref<HTMLDivElement> = createRef();

  @property()
  source: SourceData | undefined

  @property()
  playing = false;

  @property()
  recording = false;

  debug = true;

  override render() {
    return html`
      <div ${ ref(this.contentsEl) } id="contents">
        <video @pause=${ this.onPause } @loadedmetadata=${ this.onLoadedMetadata } @playing=${ this.onPlaying } @ended=${ this.onEnded } loop autoplay muted playsInline webkitPlaysInline ${ ref(this.videoEl) }></video>
        <pose-overlay ${ ref(this.overlayEl) } id="overlay"></pose-overlay>
      </div>
      <div id="controls">
        <source-selector .source=${ this.source } @change=${ this.onSourceChange } ${ ref(this.sourceSelectorEl) }></source-selector>
        <button @click=${ this.onButtonPlayStop }>${ this.playing ? `Stop` : `Play` }</button>
        <button @click=${ this.onButtonRecStartStop }>${ this.recording ? `Stop Recording` : `Record` }</button>
      </div>
    `;
  }

  setRecordings(recordings: RecordingData[]) {
    const el = this.sourceSelectorEl.value;
    if (el) {
      el.recordings = recordings;
    } else {
      console.warn(`Can't set recordings, no element`);
    }
  }

  getVideoElement() {
    return this.videoEl.value;
  }

  getOverlayElement() {
    return this.overlayEl.value;
  }

  onButtonPlayStop() {
    this.dispatchEvent(new CustomEvent(`playstop`, { detail: !this.playing }));
  }

  onButtonRecStartStop() {
    this.dispatchEvent(new CustomEvent(`recstartstop`, { detail: !this.recording }));
  }

  onLoadedMetadata() {
    this.resizeElements();
  }

  /**
   * From video element - now playing
   */
  onPlaying() {
    this.dispatchEvent(new CustomEvent(`state`, { detail: `playing` }));
  }

  /**
   * From video element - now stopped
   */
  onPause() {
    this.dispatchEvent(new CustomEvent(`state`, { detail: `stopped` }));
  }

  /**
   * From video element - now stopped
   */
  onEnded() {
    this.dispatchEvent(new CustomEvent(`state`, { detail: `stopped` }));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(`resize`, () => {
      this.resizeElements();
    });
  }

  resizeElements() {
    const c = this.overlayEl.value;
    const contents = this.contentsEl.value;
    const v = this.videoEl.value;

    if (!contents || !v || !c) return;

    const container = this.getBoundingClientRect();
    // const vpW = window.innerWidth;
    // const vpH = window.innerHeight;
    let w = v.videoWidth;
    let h = v.videoHeight;

    const isVideoLandscape = w >= h;
    const videoRatioWoverH = w / h;
    const videoRatioHoverW = h / w;
    const isLandscape = w >= h;

    let constrainedDimension = isVideoLandscape ? `width` : `height`;
    if (isLandscape) constrainedDimension = `height`;

    if (constrainedDimension === `width`) {
      w = container.width;
      h = w * videoRatioHoverW;
    } else {
      h = container.height;
      w = h * videoRatioWoverH
    }

    const left = container.width / 2 - w / 2;
    const top = container.height / 2 - h / 2;
    v.style.height = c.style.height = `${ h }px`;
    v.style.width = c.style.width = `${ w }px`;

    v.style.left = c.style.left = `${ left }px`;
    v.style.top = c.style.top = `${ top }px`;
    c.setSize(w, h);
  }

  setVideoSource(source: MediaProvider | string | null | undefined) {
    const el = this.videoEl.value;
    if (el) {
      if (typeof source === `string`) {
        el.srcObject = null;
        el.src = source;
      } else {
        if (!source) {
          el.pause();
        }
        el.srcObject = source ?? null;
      }
    } else {
      console.warn(`Video element unavailable`);
    }
    if (source && el?.paused) {
      el.play();
    }
  }

  onSourceChange(event: CustomEvent) {
    const d = event.detail;
    console.log(d);

    this.dispatchEvent(new CustomEvent(`change-source`, {
      detail: d
    }));
  }
  static override styles = css`
    :host {
      display: block;
    }

    #contents {
      background-color: black;
      height: 100%;
      width: 100%;
      overflow: none;
    }
   
    video, #overlay {
      left: 0;
      top: 0;
      position: absolute;
    }
   
    video {
      opacity: 0.6;
    }

    #controls {
      padding: 0.5rem;
      position: absolute;
      left: 0;
      top: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ml-vision': MlVision;
  }
}
