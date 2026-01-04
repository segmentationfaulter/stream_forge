/**
 * Uses ffprobe to extract metadata from a video file.
 */

import type { FFProbeOutput, VideoMetadata } from "../../types/ffmpeg";

export const probeVideo = async (inputPath: string): Promise<VideoMetadata> => {
  const args = [
    "ffprobe",
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    inputPath,
  ];

  const proc = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "ignore",
  });

  const output = (await new Response(proc.stdout).json()) as FFProbeOutput;

  // Find the first video stream
  const videoStream = output.streams.find((s) => s.codec_type === "video");

  if (!videoStream) {
    throw new Error("No video stream found in file");
  }

  // Calculate FPS (usually returned as "30000/1001" string)
  const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
  const fps = den && num ? num / den : 0;

  return {
    width: videoStream.width,
    height: videoStream.height,
    duration: parseFloat(output.format.duration),
    fps,
  };
};
