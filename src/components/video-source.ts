import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import type { SourceData, Verbosity } from '../types.js';
import { Log } from '../util/log.js';

export type VideoSourceStates = `started` | `stopped`;

/**
 * Events:
 * * state
 * * sized: {width/height}
 */
@customElement('video-source')
export class VideoSourceElement extends LitElement {
  videoEl: Ref<HTMLVideoElement> = createRef();

  @property()
  source: SourceData | undefined

  log = new Log(`VideoSourceElement`, `errors`);
  #state = `stopped`;

  @property()
  showPreview: boolean = true

  override render() {
    return html`
      <video class=${ this.showPreview ? `show` : `hide` } @pause=${ this.onPause } @loadedmetadata=${ this.onLoadedMetadata } @playing=${ this.onPlaying } @ended=${ this.onEnded } loop autoplay muted playsInline webkitPlaysInline ${ ref(this.videoEl) }></video>
    `;
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  getVideoElement() {
    return this.videoEl.value;
  }

  getVideoSize() {
    const el = this.videoEl.value;
    if (!el) return;
    return {
      width: el.videoWidth,
      height: el.videoHeight
    }
  }

  get isStarted() {
    return this.#state === `started`;
  }

  start() {
    const el = this.videoEl.value;
    if (!el) {
      console.warn(`No video element`)
    } else {
      el.play();
    }
  }

  stop() {
    const el = this.videoEl.value;
    if (!el) {
      console.warn(`No video element`)
    } else {
      el.pause();
    }
  }

  onLoadedMetadata() {
    const el = this.videoEl.value;
    if (!el) return;
    this.dispatchEvent(new CustomEvent(`sized`, {
      detail: {
        width: el.videoWidth,
        height: el.videoHeight
      }
    }
    ));
  }

  #setState(state: VideoSourceStates) {
    const prior = this.#state;
    if (state === prior) return;
    this.#state = state;
    this.log.debug(`state ${ prior } -> ${ state }`);
    this.dispatchEvent(new CustomEvent(`state`, {
      detail: {
        priorState: prior,
        newState: state
      }
    }));
  }

  /**
   * From video element - now playing
   */
  onPlaying() {
    this.#setState(`started`);
  }

  /**
   * From video element - now stopped
   */
  onPause() {
    this.#setState(`stopped`);
  }

  /**
   * From video element - now stopped
   */
  onEnded() {
    this.#setState(`stopped`);
  }

  setVideoSource(source: MediaProvider | string | null | undefined) {
    const el = this.videoEl.value;

    if (el) {
      el.classList.remove(`hide`);

      if (typeof source === `string`) {
        el.srcObject = null;
        el.src = source;
      } else {
        if (!source) {
          el.pause();
          el.classList.add(`hide`);
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


  static override styles = css`
    :host {
      display: block;
    }
    video {
      width: 100%;
      height: 100%;
      opacity: 0.5;
    }
    video.hide {
      display:none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'video-source': VideoSourceElement;
  }
}
