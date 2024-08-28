import type { VideoSourceElement } from "../components/video-source.js";
import type { CameraOptions, ISource, SourceData } from "../types.js";

export class VideoElementSource implements ISource {
  mediaStream: MediaStream | undefined;

  constructor(readonly src: VideoSourceElement, readonly data: SourceData, readonly camera: CameraOptions) {

  }

  async start(): Promise<boolean> {
    let stream: undefined | MediaStream | string = undefined;
    switch (this.data.kind) {
      case "camera": {
        stream = await this.getMediaStream();
        this.mediaStream = stream;
        break;
      }
      case "file": {
        stream = this.data.id;
        break;
      }
    }
    this.src.setVideoSource(stream);
    if (stream) {
      this.src.start();
      return true;
    } else {
      this.src.stop();
      return false;
    }
  }

  stop(): void {
    if (this.mediaStream) {
      for (const vt of this.mediaStream.getVideoTracks()) {
        vt.stop();
      }
    }
    this.src.stop();
  }

  async getMediaStream() {
    if (this.data.id === `-`) return undefined;
    const c = getConstraints(this.data, this.camera);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(c);

      return stream;
    } catch (error: unknown) {
      if (typeof error === `object`) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const name = (error as any).name ?? ``;
        if (name === `OverconstrainedError`) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.error(`Overconstrained error: ${ (error as any).constraint }`);
          console.error(`Constraints: ${ JSON.stringify(c) }`);
        }
      }
      throw error;
    }
  }
}

export const getConstraints = (source: SourceData, options: CameraOptions) => {
  const video: Partial<MediaTrackConstraints> = {}
  if (source.id.length > 0) {
    video.deviceId = { exact: source.id };
  }
  if (options.facingMode) {
    video.facingMode = options.facingMode;
  }
  if (options.height) {
    video.height = { ideal: options.height }
  }
  if (options.width) {
    video.width = { ideal: options.width }
  }
  const constraints: MediaStreamConstraints = {
    video
  };
  return constraints;
}