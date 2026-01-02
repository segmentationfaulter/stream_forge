# FFmpeg for StreamForge: The Essential Guide

This document covers the specific FFmpeg concepts and commands used in the **StreamForge** project. We use FFmpeg to **transcode** raw user uploads into **Adaptive Bitrate (ABR)** HLS streams.

## 1. The Goal: One Input, Multiple Outputs

We need to take a single video file (e.g., `input.mov`) and generate multiple versions of it (720p, 360p) plus a "Master Playlist" that links them together.

Instead of running FFmpeg twice (which would be slow and wasteful), we use a **Single-Pass Multi-Output** command.

## 2. The Command Structure

We use the **Stream Mapping** strategy. This allows us to "reuse" the input streams for multiple output variants.

### The Actual Command We Generate

```bash
ffmpeg \
  -i input.mp4 \ # (1) Input
  -map 0:v:0 -map 0:a:0 \ # (2) Select streams for Variant 1
  -s:v:0 1280x720 -b:v:0 2800k \ # (3) Configure Variant 1 (720p)
  -map 0:v:0 -map 0:a:0 \ # (4) Select streams for Variant 2
  -s:v:1 640x360 -b:v:1 800k \ # (5) Configure Variant 2 (360p)
  -f hls \ # (6) Output Format
  -var_stream_map "v:0,a:0 v:1,a:0" \ # (7) Grouping
  -master_pl_name master.m3u8 \
  output/%v/index.m3u8
```

### Explanation of Flags

| Flag              | Meaning         | StreamForge Context                                                                                                                              |
| :---------------- | :-------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| `-i input.mp4`    | **Input**       | The raw video file uploaded by the user.                                                                                                         |
| `-map 0:v:0`      | **Map Video**   | Take the **0**th input's **v**ideo stream **0**. We use this multiple times to "clone" the video for processing.                                 |
| `-map 0:a:0`      | **Map Audio**   | Take the **0**th input's **a**udio stream **0**. We map this to _every_ variant so they all have sound.                                          |
| `-s:v:{N}`        | **Scale**       | Sets the resolution for the _Nth_ output video stream. E.g., `-s:v:0 1280x720`.                                                                  |
| `-b:v:{N}`        | **Bitrate**     | Sets the target bitrate for the _Nth_ output. E.g., `-b:v:0 2800k` (2.8 Mbps).                                                                   |
| `-f hls`          | **Format**      | Tells FFmpeg to output an HLS directory structure (segments + playlists) instead of a single file.                                               |
| `-var_stream_map` | **Variant Map** | Critical for HLS. It tells FFmpeg which video and audio streams belong together. `"v:0,a:0"` means "Combine Output Video 0 with Output Audio 0". |

## 3. Critical Production Flags (The "Secret Sauce")

While the basic mapping command above _works_, professional-grade streaming requires strict constraints to prevent buffering, player crashes, and compatibility issues.

### A. GOP Alignment (`-g`, `-keyint_min`)

- **The Problem:** HLS splits video into chunks (e.g., 6 seconds). The player needs to switch qualities exactly at the cut point.
- **The Constraint:** Every quality variant (720p, 360p) must have a **Keyframe (I-Frame)** at the exact same timestamp.
- **The Fix:** Force a Keyframe every 2 seconds.
  - `ffmpeg -g 60 -keyint_min 60 -sc_threshold 0` (Assuming 30fps)

### B. Pixel Format (`-pix_fmt yuv420p`)

- **The Problem:** High-end cameras record in "10-bit color" or "4:2:2" formats. Most web browsers **cannot** play these.
- **The Fix:** Always convert to `yuv420p` (the standard web-safe color format).

### C. Audio Normalization (`-aac_adtstoasc`)

- **The Problem:** Raw AAC audio streams sometimes lack headers that the HLS container (MPEG-TS) needs.
- **The Fix:** Use the bitstream filter `-bsf:a aac_adtstoasc` to repair the audio headers on the fly.

## 4. Performance Tuning

### `-preset`

Controls the trade-off between **Encoding Speed** vs **Compression Efficiency**.

- `ultrafast`: Fast, but wastes bandwidth (larger file size for same quality).
- `fast` / `medium`: Good balance for VOD.
- `veryslow`: Tiny files, but takes forever to process.

### `-threads 0`

Tells FFmpeg to use all available CPU cores. This is usually the default, but explicit setting ensures we utilize the server fully.

## 5. Readings

- [Ultimate FFmpeg Guide](https://img.ly/blog/ultimate-guide-to-ffmpeg/)
- [A Guide to Batch Video Editing & Server Automation with FFmpeg](https://img.ly/blog/building-a-production-ready-batch-video-processing-server-with-ffmpeg/)
