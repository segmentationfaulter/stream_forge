# Understanding Streams: The Data Flow of StreamForge

This guide covers how we handle data flow in **StreamForge**. As a mid-level engineer, you need to understand **Streams**, **Pipes**, and **Redirection** to effectively work with FFmpeg and large files without crashing the server.

## 1. The Three Standard Streams

Every CLI tool (including Node.js scripts and FFmpeg) has three default channels for communicating with the outside world.

### 1. Standard Input (`stdin`) - The Input Channel

- **The Source:** Default is your keyboard.
- **The Usage:** Feeding data _into_ a program.
- **Example:** When you pipe a file into FFmpeg (`cat video.mp4 | ffmpeg ...`), FFmpeg reads from `stdin`.

### 2. Standard Output (`stdout`) - The Data Channel

- **The Destination:** Default is your terminal screen.
- **The Usage:** The _actual result_ of the program.
- **The Rule:** This stream should remain **pure**. If a program outputs JSON or binary video data, it must **never** print logs here. One stray `console.log` can corrupt a binary file being generated on `stdout`.

### 3. Standard Error (`stderr`) - The Log Channel

- **The Destination:** Default is your terminal screen (mixed with `stdout`).
- **The Usage:** Logs, progress bars, debugging info, and errors.
- **The Logic:** By separating "Logs" (`stderr`) from "Data" (`stdout`), we can pipe the data to another tool while still seeing the progress bars on our screen.

---

## 2. Why FFmpeg Uses `stderr` for Everything

You might notice that even when FFmpeg runs successfully, it prints walls of text to `stderr`.

**This is a feature, not a bug.**

FFmpeg is designed to be part of a **Pipeline**.

- **Scenario:** You want to decode a video and pipe the raw bytes to a custom analysis tool.
- **Command:** `ffmpeg -i input.mp4 -f rawvideo - | my-analysis-tool`
- **The Flow:**
  - **Data (`stdout`):** Raw video frames flow silently into `my-analysis-tool`.
  - **Logs (`stderr`):** "frame=100 fps=30..." prints to your screen so you know it's working.

If FFmpeg printed logs to `stdout`, `my-analysis-tool` would try to analyze the text "frame=100" as if it were a pixel, causing a crash.

---

## 3. Pipes (`|`) and Backpressure

The pipe character `|` connects the `stdout` of the left command to the `stdin` of the right command.

### The Problem: RAM Explosion

Imagine reading a 10GB file and sending it to a slow processing tool. If you read everything into a variable:

```javascript
const hugeFile = fs.readFileSync("10gb-movie.mp4"); // CRASH! Out of Memory
```

### The Solution: Streaming & Backpressure

Pipes handle **Backpressure** automatically.

1.  **Source** reads a chunk (64KB).
2.  **Pipe** passes it to **Destination**.
3.  If **Destination** is slow, the **Pipe** fills up.
4.  The system tells **Source** to _pause reading_ until **Destination** catches up.
5.  **Result:** You process a 10GB file using only ~64KB of RAM.

---

## 4. Practical Redirection

Common patterns you will see in our scripts or deployment configs:

- **`command > file.txt`**: Save the **Data** (`stdout`) to a file.
- **`command 2> error.log`**: Save the **Logs/Errors** (`stderr`) to a file.
- **`command > all.log 2>&1`**: "Point stream 2 (stderr) to where stream 1 (stdout) is going." This merges logs and data into a single file (useful for debugging cron jobs).

---

## 5. How This Looks in Our Code

In `src/lib/ffmpeg/transcoder.ts`, we use `Bun.spawn` to manage these streams explicitly:

```typescript
const proc = Bun.spawn(["ffmpeg", ...], {
  // Stdout: 'ignore' (or 'inherit')
  // We are writing to HLS files on disk, so FFmpeg's stdout is empty.
  // We can ignore it.
  stdout: "ignore",

  // Stderr: 'pipe'
  // We want to capture the logs programmatically.
  // We read this stream to detect errors or track progress.
  stderr: "pipe",
});

// Reading the log stream
const reader = proc.stderr.getReader();
// ... loop and read chunks ...
```

## 6. Readings

- [Streams Introduction](https://www.lucasfcosta.com/blog/streams-introduction)
- [Bash One-Liners Explained, Part III: All about redirections](https://catonmat.net/bash-one-liners-explained-part-three)

### Summary for StreamForge

1.  **Never** parse `stdout` for FFmpeg logs; look in `stderr`.
2.  **Always** use streams/pipes for file handling to keep RAM usage low.
3.  **Respect** the separation of Data and Logs.
