import { buildFFmpegArgs } from "./args";
import type { TranscodeOptions } from "../../types/ffmpeg";

/**
 * Orchestrates the FFmpeg process using Bun's high-performance process API.
 * 
 * # Process Management Strategy
 * We use `Bun.spawn` instead of the traditional Node.js `child_process` because:
 * 1. **Optimized for Bun:** `Bun.spawn` is built for high-throughput I/O in the Bun runtime.
 * 2. **Type Safety:** It provides a cleaner, more modern Promise-based interface.
 * 3. **Memory Efficiency:** It handles streaming data with zero-copy where possible.
 * 
 * # FFmpeg Logging & Stderr
 * FFmpeg is "noisy" and writes almost all status, progress, and warning information 
 * to `stderr` rather than `stdout`. Even a successful run will have a full `stderr` stream.
 * 
 * We capture this stream to:
 * 1. Log real-time progress (optional but helpful).
 * 2. Provide a detailed post-mortem if the process fails (exit code !== 0).
 * 
 * @param options - Configuration for the transcoding job (input path, output dir, profiles).
 * @returns A Promise that resolves when transcoding finishes successfully (exit code 0).
 */
export const transcodeVideo = async (options: TranscodeOptions): Promise<void> => {
  const ffmpegArgs = buildFFmpegArgs(options);
  const command = ["ffmpeg", ...ffmpegArgs];

  console.log(`[Transcoder] Initializing FFmpeg...`);
  console.debug(`[Transcoder] Execution: ${command.join(" ")}`);

  const proc = Bun.spawn(command, {
    stderr: "pipe", // Capture FFmpeg logs for progress and error reporting
    stdout: "inherit", // HLS muxer writes to files, so stdout is usually empty
  });

  // We buffer the stderr to provide context in case of a crash.
  // Using a simple array of strings as a buffer.
  const stderrBuffer: string[] = [];
  const decoder = new TextDecoder();

  // Consume the stderr stream directly
  // This loop will run until the stream closes (when FFmpeg exits)
  try {
    for await (const chunk of proc.stderr) {
      const text = decoder.decode(chunk);
      stderrBuffer.push(text);
      
      // Optional: Real-time progress parsing would go here
    }
  } catch (err) {
     console.error("[Transcoder] Error reading stderr stream:", err);
  }

  // By the time the loop above finishes, the process has essentially finished writing.
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const fullLog = stderrBuffer.join("");
    // We only show the last 1000 characters of the log to avoid flooding the console
    const recentLogs = fullLog.length > 1000 ? `...${fullLog.slice(-1000)}` : fullLog;
    
    console.error(`[Transcoder] FFmpeg failed with exit code ${exitCode}`);
    console.error(`[Transcoder] Recent Logs:\n${recentLogs}`);
    
    throw new Error(`FFmpeg failed with exit code ${exitCode}. Check logs above for details.`);
  }

  console.log(`[Transcoder] Successfully generated HLS stream in ${options.outputDir}`);
};
