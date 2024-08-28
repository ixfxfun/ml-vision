

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getProcessorModes, validateProcessorMode } from '../processor-modes.js';

@customElement('model-element')
export class ModelElement extends LitElement {
  static override styles = css`
    :host {
      display: block;
    
    }
  `;


  override render() {
    const modes = getProcessorModes();

    return html`
      <select @change=${ this.onSelectChange }>
      ${ modes.map(m => html`<option>${ m }</option>`) }
      </select>
    `;
  }

  onSelectChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;

    this.dispatchEvent(new CustomEvent(`request-mode`, {
      detail: {
        mode: validateProcessorMode(value)
      }
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'model-element': ModelElement;
  }
}
