import { parseArgs } from "util";
import { transcodeVideo } from "./lib/ffmpeg/transcoder";
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
    const startTime = performance.now();

    await transcodeVideo({
      inputPath: values.input,
      outputDir: values.output,
      profiles: DEFAULT_TRANSCODE_PROFILES,
    });

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`[CLI] Job completed successfully in ${duration}s`);
  } catch (error) {
    console.error(`[CLI] Job failed:`, error);
    process.exit(1);
  }
};

main();
