

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RecordingData, SourceData, Verbosity } from '../types.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import type { SourcesState } from '../sources/index.js';

/**
 * An example element.
 *
 * @fires count-changed - Indicates when the count changes
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('rec-panel')
export class RecPanel extends LitElement {
  static override styles = css`
    :host {
      display:block;
      background-color: hsla(0,0%,30%,0.5);
    }
    #contents {
      padding: 0.5rem;
    }
    #toolbar {
      margin-bottom: 0.5rem;
    }
  `;

  @property()
  recordings: SourceData[] = []

  @property()
  playing = false;

  selectEl: Ref<HTMLSelectElement> = createRef();

  override render() {
    if (this.recordings.length === 0) {
      return html`<em>No recordings</em>`;
    }

    let recs = [

      ...this.recordings
    ]
    return html`
    <div id="contents">
      <div id="toolbar">
        <button @click=${ this.onStartStopClick }>${ this.playing ? `Stop` : `Play` }</button>
      </div>
      <select ${ ref(this.selectEl) } @change=${ this.onSelectChange }>
        ${ this.recordings.map(r => html`<option .source=${ r }>${ r.label }</option>`) }
      </select>
      <button @click=${ this.onDeleteClick }>Delete</button>
    </div>
    `;
  }

  onStartStopClick() {
    const rec = this.getSelected();
    if (!rec) {
      console.warn(`No recording selected?`);
      return;
    }
    this.dispatchEvent(new CustomEvent(`startstop`, { detail: rec }));
  }

  onSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (!target) return;
    const item = target.item(target.selectedIndex);
    if (!item) return;
    const recording = (item as any).recording as RecordingData;

  }

  getSelected(): SourceData | undefined {
    const el = this.selectEl.value;
    if (!el) return;
    const item = el.item(el.selectedIndex);
    if (!item) return;
    return (item as any).source as SourceData;
  }

  onDeleteClick() {
    const rec = this.getSelected();
    if (!rec) return;
    this.dispatchEvent(new CustomEvent(`request-delete`, { detail: rec }));
  }



  // #setState(state: RecPanelStates) {
  //   const prior = this.#state;
  //   if (state === prior) return;
  //   this.#state = state;
  //   this.#log(`state ${ prior } -> ${ state }`);
  //   this.dispatchEvent(new CustomEvent(`state`, {
  //     detail: {
  //       priorState: prior,
  //       newState: state
  //     }
  //   }));
  // }



  notifySourceState(state: SourcesState) {
    this.playing = state === `started`;
  }

  // onToggle() {
  //   this.expanded = !this.expanded;
  // }
}

declare global {
  interface HTMLElementTagNameMap {
    'rec-panel': RecPanel;
  }
}
