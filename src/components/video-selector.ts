import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SourceData } from '../types.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import type { SourcesState } from '../sources/index.js';

@customElement('video-selector')
export class VideoSelector extends LitElement {
  static override styles = css`
    :host {
      display:block;
      background-color: hsla(0,0%,30%,0.5);
    }
    #contents {
      padding: 0.5rem;
    }
    input {
      display: none;
    }
    #toolbar {
      margin-bottom: 0.5rem;
    }
  `;

  @property()
  source: SourceData | undefined;

  @property()
  playing = false;

  @property()
  cameras: SourceData[] = []

  #fileInputEl: Ref<HTMLInputElement> = createRef();
  #selectEl: Ref<HTMLSelectElement> = createRef();

  override render() {
    const source = this.source;
    let sel = ``;
    if (source) {
      if (source.kind === `camera`) {
        const first = this.cameras[ 0 ];
        if (source.id === `` && first) {
          sel = first.id;
        } else {
          sel = source.id;
        }
      }
    }


    const cameras = this.cameras.length === 0 ? html`` : html`
          ${ this.cameras.map(d => html`<option .source=${ d } ?selected=${ d.id === sel } value=${ d.id }>${ d.label }</option>`) }`

    return html`
    <div id="contents">
      <div id="toolbar"><button @click=${ this.onStartStopClick }>${ this.playing ? `Stop` : `Start` }</button></div>
      <select ${ ref(this.#selectEl) } @change=${ this.onCameraSelectChange }>
        ${ cameras }
      </select>
      <input @change=${ this.onFileChange } ${ ref(this.#fileInputEl) } id="fileInput" type="file" accept="video/*" />
      <button @click=${ this.onFileSelect }>File</button>
    </div>
    `;
  }

  getSelected(): SourceData | undefined {
    const el = this.#selectEl.value;
    if (!el) return;
    const item = el.item(el.selectedIndex);
    if (!item) return;
    return (item as any).source as SourceData;
  }

  /**
 * Start stop source & processing
 */
  onStartStopClick() {
    this.dispatchEvent(new CustomEvent(`startstop`, { detail: this.getSelected() }));
  }

  onFileSelect() {
    this.#fileInputEl.value?.click();
  }

  notifySourceState(state: SourcesState) {
    this.playing = state === `started`;
  }

  onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target) return;
    if (!target.files) return;
    const files = target.files;
    if (files.length === 0) return;

    const url = URL.createObjectURL(files[ 0 ] as unknown as MediaSource);
    const s: SourceData = {
      id: url,
      label: `file`,
      kind: `file`
    };

    this.dispatchEvent(new CustomEvent(`change`, {
      detail: s
    }));
  }

  /**
   * User has selected a camera
   * @param event
   * @returns 
   */
  onCameraSelectChange(event: Event) {
    const t = event.target as HTMLSelectElement;
    const opt = t.item(t.selectedIndex);
    if (!opt) return;
    const value = opt.value;
    this.source = {
      kind: `camera`,
      label: opt.innerText,
      id: value
    }
    this.dispatchEvent(new CustomEvent(`change`, { detail: this.source }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    // @ts-ignore
    'video-selector': VideoSelector;
  }
}
