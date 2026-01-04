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

export type VideoMetadata = {
  width: number;
  height: number;
  duration: number;
  fps: number;
};

export type FFProbeOutput = {
  streams: Array<{
    codec_type: string;
    width: number;
    height: number;
    r_frame_rate: string;
  }>;
  format: {
    duration: string;
  };
};
