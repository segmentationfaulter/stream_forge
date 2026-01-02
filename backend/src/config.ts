import type { VideoProfile } from "./types/ffmpeg";

export const DEFAULT_TRANSCODE_PROFILES: VideoProfile[] = [
  { name: "720p", width: 1280, height: 720, bitrate: "2500k" },
  { name: "360p", width: 640, height: 360, bitrate: "800k" },
];
