import type { RecordingData, SourceData } from "../types.js";
import type { Sources } from "./index.js";

export class Recordings {
  #store: RecordingData[] = []

  constructor(private readonly sources: Sources) {

  }

  delete(source: SourceData) {
    const filtered = this.#store.filter(rd => rd.name !== source.id);
    if (filtered.length !== this.#store.length) {
      this.#store = filtered;
      this.save();
    }
  }

  getSources(): SourceData[] {
    return this.#store.map<SourceData>(r => ({
      id: r.name,
      kind: `recording`,
      label: r.name
    }));
  }

  getRecording(name: string) {
    return this.#store.find(r => r.name === name);
  }

  add(data: RecordingData) {
    this.#store.push(data);
    this.save();
  }

  save() {
    localStorage.setItem(`recordings`, JSON.stringify(this.#store));
    this.sources.notifySourceUpdated(this);
  }

  init() {
    const s = localStorage.getItem(`recordings`);
    if (!s) return;
    try {
      const o = JSON.parse(s) as any[];
      for (const d of o) {
        this.#store.push(d);
      }
      this.sources.notifySourceUpdated(this);
    } catch (error) {
      console.error(error);
    }
  }

  promptName() {
    const formatOpts: Intl.DateTimeFormatOptions = {
      dateStyle: `short`,
      timeStyle: `short`
    }
    const defaultName = new Intl.DateTimeFormat("se-SE", formatOpts).format(Date.now()) + ' recording ' + this.#store.length + 1;

    const name = window.prompt(`Name for recording`, defaultName);
    return name;
  }
}