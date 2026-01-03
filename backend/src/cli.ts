import { parseArgs } from "util";
import { transcodeVideo } from "./lib/ffmpeg/transcoder";
import { probeVideo } from "./lib/ffmpeg/probe";
import { DEFAULT_TRANSCODE_PROFILES } from "./config";

/**
 * StreamForge Transcoder CLI
 *
 * # Why do we need a CLI?
 * While the final application will call `transcodeVideo` programmatically via an API,
 * this CLI serves three critical roles:
 *
 * 1. **Isolation:** Allows us to develop and verify the FFmpeg pipeline independently
 *    of the complex HTTP upload layer.
 * 2. **Velocity:** Provides a fast feedback loop. Running a shell command is quicker
 *    than performing a full browser upload test.
 * 3. **Ops:** Functions as a manual administrative tool for re-processing videos
 *    in production without triggering the entire application flow.
 */

const main = async () => {
  // Parse command line arguments
  // Usage: bun run src/cli.ts --input ./video.mp4 --output ./hls_output
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      input: {
        type: "string",
      },
      output: {
        type: "string",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  if (!values.input || !values.output) {
    console.error("Usage: bun run src/cli.ts --input <file> --output <dir>");
    process.exit(1);
  }

  console.log(`[CLI] Starting job for: ${values.input}`);

  try {
    // 1. Probe the input file to get resolution/metadata
    console.log(`[CLI] Probing input file...`);
    const metadata = await probeVideo(values.input);
    console.log(
      `[CLI] Input detected: ${metadata.width}x${metadata.height} @ ${metadata.fps.toFixed(2)}fps`,
    );

    // 2. Filter profiles to avoid upscaling
    // We only keep profiles where the height is <= input height
    // If the input is weird (e.g. 500p), we accept 360p but reject 720p.
    const validProfiles = DEFAULT_TRANSCODE_PROFILES.filter(
      (p) => p.height <= metadata.height,
    );

    if (validProfiles.length === 0) {
      console.warn(
        "[CLI] Warning: Input resolution is lower than all target profiles.",
      );
      console.warn("[CLI] Using the lowest quality profile by default.");
      validProfiles.push(
        DEFAULT_TRANSCODE_PROFILES.find((p) => p.name === "360p")!,
      );
    }

    console.log(
      `[CLI] Selected Profiles: ${validProfiles.map((p) => p.name).join(", ")}`,
    );

    const startTime = performance.now();

    await transcodeVideo({
      inputPath: values.input,
      outputDir: values.output,
      profiles: validProfiles,
    });

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`[CLI] Job completed successfully in ${duration}s`);
  } catch (error) {
    console.error(`[CLI] Job failed:`, error);
    process.exit(1);
  }
};
main();
