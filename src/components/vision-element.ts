import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { VideoSelector } from './video-selector.js';
import type { Options, SourceData } from '../types.js';
import { OverlayElement } from './pose-overlay.js';
import type { VideoSourceElement } from './video-source.js';
import type { RecPanel } from './rec-panel.js';
import { Recorder } from '../recorder.js';
import type { SourcesState } from '../sources/index.js';
import type { ProcessorModes } from '../processor-modes.js';

@customElement('vision-element')
export class VisionElement extends LitElement {
  videoSelectorEl: Ref<VideoSelector> = createRef();
  videoSourceEl: Ref<VideoSourceElement> = createRef();
  overlayEl: Ref<OverlayElement> = createRef();
  recPanelEl: Ref<RecPanel> = createRef();
  debug = true;

  #lastCameras: SourceData[] = [];
  #lastRecordings: SourceData[] = [];
  #lastSource: SourceData | undefined;
  #lastOptions: Options | undefined

  @property()
  uiSource: `video` | `recording` = `video`

  @property()
  recorder: Recorder | undefined;

  @property()
  hideModelSelector = false;

  override render() {
    return html`
      <div id="sources">
        <video-source id="video" ${ ref(this.videoSourceEl) } @sized=${ this.onVideoSized }></video-source>
        <overlay-element @click=${ this.onOverlayClick } id="overlay" ${ ref(this.overlayEl) } ></overlay-element>
      </div>
      <div id="controls">
        ${ this.hideModelSelector ?
        html`` :
        html`<details><summary>Model</summary>
                  <model-element @request-mode=${ this.onRequestMode }></model-element>
                </details>`
      }
        <details><summary>Source</summary>
          <fieldset @change=${ this.onSelectSource }>
            <input type="radio" checked name="source" id="source-video" value="video"><label for="source-video">Video</label>
            <input type="radio" name="source" id="source-recording" value="recording"><label for="source-recording">Recording</label>
          </fieldset>
          <video-selector class=${ this.uiSource === `video` ? `show` : `hidden` } 
            .source=${ this.#lastSource } 
            .cameras=${ this.#lastCameras } ${ ref(this.videoSelectorEl) } 
            @startstop=${ this.onVideoStartStop }
            @change=${ this.onVideoSelectorChange }>
          </video-selector>
          <rec-panel class=${ this.uiSource === `recording` ? `show` : `hidden` } 
            .recordings=${ this.#lastRecordings } 
            @startstop=${ this.onRecStartStop }
            @change=${ this.onRecSelectorChange }
            @request-delete=${ this.onRecRequestDelete }
            id="rec-panel" ${ ref(this.recPanelEl) }>
            </rec-panel>
        </details>
        <details><summary>Recording</summary>
        ${ this.getRecordingUi() }
        </details>
      </div>
    `;
  }

  onRequestMode(event: Event) {
    this.dispatchEvent(new CustomEvent(`request-mode`, {
      detail: (event as CustomEvent).detail
    }));
  }

  onRecRequestDelete(event: Event) {
    const detail = (event as CustomEvent).detail as SourceData;
    this.dispatchEvent(new CustomEvent(`request-source-delete`, { detail }))
  }

  onRecSelectorChange(event: Event) {
    const detail = (event as CustomEvent).detail as SourceData;
    this.dispatchEvent(new CustomEvent(`request-source`, { detail }))
  }

  /**
   * User has choosing a new camera
   * @param event 
   */
  onVideoSelectorChange(event: Event) {
    const detail = (event as CustomEvent).detail as SourceData;
    this.dispatchEvent(new CustomEvent(`request-source`, { detail: detail }))
  }

  onRecStartStop(event: Event) {
    const detail = (event as CustomEvent).detail as SourceData;
    this.dispatchEvent(new CustomEvent(`source-startstop`, {
      detail
    }))
  }

  onVideoStartStop(event: Event) {
    const detail = (event as CustomEvent).detail as SourceData;
    this.dispatchEvent(new CustomEvent(`source-startstop`, {
      detail
    }))
  }

  getRecordingUi() {
    if (!this.recorder) return html`<button @click=${ this.onStartRecording }>Start recording</button>`;
    const r = this.recorder;
    switch (r.state) {
      case 'recording': {
        return html`<button @click=${ this.onStopRecording }>Stop recording</button>`
      }
      case 'complete': {
        return html`<em>Complete</em>`
      }
    }
  }

  onStopRecording() {
    const r = this.recorder;
    if (!r) return;
    r.stop();
    this.recorder = undefined;
  }

  onStartRecording() {
    this.dispatchEvent(new CustomEvent(`request-recorder`));
  }

  onOverlayClick() {
    this.videoSourceEl.value?.togglePreview();
  }

  setOptions(options: Options) {
    this.#lastOptions = options
  }

  /**
   * User swapped between camera/recording in UI
   * @param event 
   * @returns 
   */
  onSelectSource(event: Event) {
    const t = event.target as HTMLInputElement;
    if (!t) return;
    if (t.value === `video`) {
      this.uiSource = `video`;
    } else if (t.value === `recording`) {
      this.uiSource = `recording`;
    }
  }

  /**
   * Notification that sources have been updated
   * @param sources 
   */
  onSourcesUpdated(cameras: SourceData[], recordings: SourceData[]) {
    this.#lastCameras = cameras;
    this.#lastRecordings = recordings;
    const el = this.videoSelectorEl.value;
    if (el) {
      el.cameras = cameras
    }

    const recPanel = this.recPanelEl.value;
    if (recPanel) {
      recPanel.recordings = this.#lastRecordings;
    } else {
      console.warn(`Not able to set recordings, element missing.`)
    }

  }



  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(`resize`, () => {
      this.resizeElements();
    });
  }

  protected override firstUpdated(_changedProperties: PropertyValues): void {
    const overlay = this.overlayEl.value;
    const opts = this.#lastOptions?.overlay;
    if (overlay && opts) {
      overlay.labelPoints = opts.label;
    } else {
      console.warn(`Not able to set options for overlay, element missing.`);
    }
  }

  updateRecPanel() {
    const el = this.shadowRoot?.getElementById(`rec-panel`) as RecPanel | null;
    const recPanel = this.recPanelEl.value || el;
    if (recPanel) {
      recPanel.recordings = this.#lastRecordings;
    } else {
      console.warn(`Not able to set recordings, element missing.`)
    }
  }

  /**
   * Notification that source has changed
   * @param source 
   */
  notifySourceChange(source: SourceData) {
    this.#lastSource = source;
    let el = this.videoSelectorEl.value;
    if (el) {
      el.source = source;
    }
  }

  notifySourceState(state: SourcesState, source?: SourceData) {
    if (!source) {
      this.videoSelectorEl.value?.notifySourceState(state);
      this.recPanelEl.value?.notifySourceState(state)
    } else if (source.kind === `camera` || source.kind === `file`) {
      this.videoSelectorEl.value?.notifySourceState(state);
    } else if (source.kind === `recording`) {
      this.recPanelEl.value?.notifySourceState(state)
    }
  }

  onVideoSized() {
    this.resizeElements();
  }

  resizeElements() {
    const overlay = this.overlayEl.value;
    const v = this.videoSourceEl.value;

    if (!v || !overlay) return;

    const container = this.getBoundingClientRect();
    const videoSize = v.getVideoSize();
    if (!videoSize) return;

    let w = videoSize?.width;
    let h = videoSize?.height;

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
    v.style.height = overlay.style.height = `${ h }px`;
    v.style.width = overlay.style.width = `${ w }px`;

    v.style.left = overlay.style.left = `${ left }px`;
    v.style.top = overlay.style.top = `${ top }px`;
    overlay.setSize(w, h);
  }

  onSourceChange(event: CustomEvent) {
    const d = event.detail;

    this.dispatchEvent(new CustomEvent(`change-source`, {
      detail: d
    }));
  }

  onReceivedData(mode: ProcessorModes, data: any) {
    const el = this.overlayEl.value;
    if (!el) return;
    el.draw(mode, data);
  }

  getVideoSource() {
    return this.videoSourceEl.value;
  }

  getVideoElement() {
    const src = this.getVideoSource();
    if (!src) return;
    return src.getVideoElement();
  }

  static override styles = css`
  :host {
    display: block;
    background-color: transparent;
    font-family: system-ui, sans-serif;
  }
  #controls {
    background: black;
    color: white;
    position: absolute;
    top: 0px;
    left: 0px;
    padding: 0.5rem;
  }
  #overlay,#video {
    position:absolute;
  }
  #sources {
    background:green;
  }
  fieldset {
    border: 0;
  }
  summary {
    user-select: none;
    pointer:default;
  }
  details {
    padding:0.3rem;
  }

  .hidden {
    display:none;
  }
  `;

}

declare global {
  interface HTMLElementTagNameMap {
    // @ts-ignore
    'vision-element': VisionElement;
  }
}
