export type VideoProfile = {
  name: string;
  width: number;
  height: number;
  bitrate: string;
};

export type TranscodeOptions = {
  inputPath: string;
  outputDir: string;
  profiles: VideoProfile[];
};
