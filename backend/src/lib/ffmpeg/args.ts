import type { TranscodeOptions } from "../../types/ffmpeg";

/**
 * Builds FFmpeg arguments for generating multi-variant HLS streams.
 *
 * # Concept: Multi-Variant HLS (Adaptive Bitrate Streaming)
 * A "Multi-Variant" HLS stream consists of a single "Master Playlist" (m3u8) that lists
 * several "Media Playlists" (variants), each representing the same video content at
 * different quality levels (resolutions/bitrates).
 *
 * ## Why do we need this? (Adaptive Bitrate - ABR)
 * 1. **Network Adaptability:** It allows the client's video player to automatically switch
 *    between qualities in real-time based on available bandwidth. If a user's connection
 *    drops, the player downgrades to 360p to prevent buffering. When it recovers, it
 *    upgrades back to 720p or 1080p.
 * 2. **Device Compatibility:** Ensures smooth playback across various devices, from
 *    high-end desktops (high bitrate) to mobile phones on unstable cellular networks.
 *
 * ## Strategy
 * This function constructs an FFmpeg command that:
 * 1. Takes a single video input.
 * 2. Creates multiple video output streams (one for each profile, e.g., 720p, 360p).
 * 3. Maps the *same* audio stream to every video variant (to save processing power).
 * 4. Generates a `master.m3u8` file that links them all together.
 *
 * ## Example Command
 * If we were to run this manually in a terminal, it would look like this:
 *
 * ```bash
 * ffmpeg \
 *   -i input.mp4 \                     # Input file
 *   -map 0:v:0 -map 0:a:0 \            # Stream 0 (720p): Map video & audio from input
 *   -s:v:0 1280x720 -b:v:0 2800k \     # Stream 0: Scale to 720p, max bitrate 2800k
 *   -map 0:v:0 -map 0:a:0 \            # Stream 1 (360p): Map video & audio from input (again)
 *   -s:v:1 640x360 -b:v:1 800k \       # Stream 1: Scale to 360p, max bitrate 800k
 *   -f hls \                           # Output format: HLS
 *   -hls_time 10 \                     # Segment length: 10 seconds
 *   -hls_playlist_type vod \           # Type: VOD (static file, not live event)
 *   -master_pl_name master.m3u8 \      # Name of the root manifest
 *   -var_stream_map "v:0,a:0 v:1,a:1" \# Grouping: Combine Video 0+Audio 0, and Video 1+Audio 1
 *   output/%v/index.m3u8               # Output path pattern (%v becomes the variant index)
 * ```
 */
export const buildFFmpegArgs = (options: TranscodeOptions): string[] => {
  const { inputPath, outputDir, profiles } = options;

  const args: string[] = [
    "-i",
    inputPath,
    "-hide_banner",
    "-loglevel",
    "info",
    "-y", // Overwrite output files
  ];

  // Production Polish Flags
  args.push(
    "-preset",
    "veryfast", // Speed up encoding for dev/test
    "-g",
    "60", // Force 2-second GOP (assuming 30fps)
    "-keyint_min",
    "60", // Minimum keyframe interval
    "-sc_threshold",
    "0", // Disable scene change detection for fixed GOP
    "-pix_fmt",
    "yuv420p", // Ensure web compatibility (8-bit color)
  );

  // Map streams and set quality for each profile
  profiles.forEach((profile, index) => {
    args.push("-map", "0:v:0");
    args.push("-map", "0:a:0");
    args.push(`-s:v:${index}`, `${profile.width}x${profile.height}`);
    args.push(`-b:v:${index}`, profile.bitrate);
  });

  // HLS global options
  args.push(
    "-f",
    "hls",
    "-hls_time",
    "10",
    "-hls_playlist_type",
    "vod",
    "-master_pl_name",
    "master.m3u8",
  );

  // Map variants to specific folders

  // Format: "v:0,a:0 v:1,a:1"

  const streamMap = profiles

    .map((_, index) => `v:${index},a:${index}`)

    .join(" ");

  args.push("-var_stream_map", streamMap);

  // Output pattern (e.g., output/%v/index.m3u8)
  // %v is replaced by the variant index or name
  args.push(`${outputDir}/%v/index.m3u8`);

  return args;
};
