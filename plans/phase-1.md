# Phase 1: The Pipeline (Plan)

**Goal:** Build a robust, functional-style CLI tool using Bun and TypeScript that takes a raw video file and converts it into an Adaptive Bitrate HLS stream (720p & 360p).

## Milestone 1: Project Skeleton & Configuration
- [ ] Initialize Bun project in `backend/`.
- [ ] Configure `tsconfig.json` (Strict mode, ESNext).
- [ ] Create directory structure:
    - `src/cli.ts` (Entry point)
    - `src/lib/ffmpeg/` (Core logic)
    - `src/types/` (Shared types)

## Milestone 2: Domain Types & FFmpeg Command Strategy
- [ ] Define Type Aliases in `src/types/ffmpeg.ts`:
    - `VideoProfile` (Resolution, Bitrate)
    - `TranscodeOptions`
- [ ] Implement `buildFFmpegArgs` function:
    - Pure function that accepts input path and options.
    - Returns an array of strings (flags) for `Bun.spawn`.
    - **Key Requirement:** Must generate flags for:
        - Master Playlist (`master.m3u8`)
        - Variant Playlists (720p, 360p)
        - Segment files (`.ts`)

## Milestone 3: Process Orchestration (The Engine)
- [ ] Implement `transcodeVideo` function in `src/lib/ffmpeg/transcoder.ts`:
    - Use `Bun.spawn` to execute the command.
    - **Error Handling:** Capture `stderr` (FFmpeg writes logs to stderr).
    - **Progress Monitoring:** Parse FFmpeg output to estimate progress (optional, but good for debugging).
    - Return a `Promise<void>` that resolves on exit code 0 or rejects on error.

## Milestone 4: The CLI Entry Point
- [ ] Implement `src/cli.ts`:
    - Use `util.parseArgs` (or simple `Bun.argv` parsing) to accept:
        - `--input <path>`
        - `--output <dir>`
    - Call `transcodeVideo`.
    - Log success/failure to console.

## Milestone 5: Verification
- [ ] Download a sample "Big Buck Bunny" or similar copyright-free video to `samples/`.
- [ ] Run the CLI against the sample.
- [ ] Verify the output:
    - `master.m3u8` exists.
    - `720p/` and `360p/` folders exist with `.ts` segments.
    - Play the `master.m3u8` in a local player (like VLC or a simple HTML wrapper).
