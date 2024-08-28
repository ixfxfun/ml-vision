import type { CameraOptions, SourceData } from "../types.js";
import { snipBefore } from "../util/text.js";
import type { Sources } from "./index.js";

export class CameraSources {
  #disabled = false;
  #cameras: SourceData[] = [];

  constructor(private readonly sources: Sources) {

  }

  init() {
    this.updateDevices();
  }

  async updateDevices() {
    if (this.#disabled) return;
    if (!(`mediaDevices` in navigator)) {
      console.warn(`navigator.mediaDevices is missing -- are you running over https:// or via localhost?`);
      this.#disabled = true;
      return;
    }
    if (!('getUserMedia' in navigator.mediaDevices)) {
      this.#disabled = true;
      console.warn(`navigator.getUserMedia is missing -- are you running over https:// or via localhost?`)
      return;
    }

    await navigator.mediaDevices.getUserMedia({ video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();

    this.#cameras = devices.filter(d => d.kind === `videoinput`).map(d => ({
      id: d.deviceId,
      kind: `camera`,
      label: snipBefore(d.label, "(").trim()
    }));

    this.sources.notifySourceUpdated(this);
  }



  get cameras() {
    return this.#cameras;
  }
}




