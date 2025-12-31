# Streams and Buffers: Systems Programming Patterns

Handling large binary data is the core engineering challenge of StreamForge.

## 1. The Concept of "Backpressure" (Deep Dive)

Imagine a conveyor belt (The Pipe).
*   **Worker A (Network)** puts boxes on the belt.
*   **Worker B (Disk/FFmpeg)** takes boxes off.

If Worker A is faster than Worker B, the boxes pile up.
In software, "piling up" means filling RAM.
If RAM fills up -> **OOM (Out Of Memory) Crash.**

**Backpressure** is the signal button Worker B presses to tell Worker A: "The belt is full! Stop putting boxes on it!"

### Internal Mechanics
*   **highWaterMark:** A threshold (e.g., 64KB).
*   When the internal buffer reaches 64KB, the stream returns `false` on a write.
*   The sender MUST pause.
*   When the buffer drains, a `drain` event fires.
*   The sender resumes.

Fortunately, `.pipe()` in Node and `io.Copy` in Go handle this logic for you.

---

## 2. Golang Implementation (`io.Reader` / `io.Writer`)

Go's interfaces are the gold standard for streaming.

### The Interfaces
```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}
```

### Example: The StreamForge Upload Handler
When a user uploads a file, you want to write it to disk.

**Bad Way (Load all into memory):**
```go
// Don't do this!
body, _ := io.ReadAll(req.Body) // Allocates 5GB RAM for a 5GB file
os.WriteFile("video.mp4", body, 0644)
```

**Good Way (Streaming):**
```go
// Efficient: Uses constant RAM (e.g., 32KB buffer)
file, _ := os.Create("video.mp4")
defer file.Close()

// Connects the taps. Data flows chunk by chunk.
// Handles backpressure automatically.
bytesWritten, err := io.Copy(file, req.Body)
```

### Example: Piping to FFmpeg
```go
// Create the command
cmd := exec.Command("ffmpeg", "-i", "pipe:0", "output.mp4")

// Get the pipe representing the process's Standard Input
stdin, _ := cmd.StdinPipe()

// Start the process
cmd.Start()

// Stream data into it
go func() {
    defer stdin.Close()
    io.Copy(stdin, request.Body) // Pump data from HTTP to FFmpeg
}()
```

---

## 3. Node.js Streams (For the Control Plane)

You will use this in your Node.js API Service.

### Types of Streams
1.  **Readable:** Source of data (e.g., `fs.createReadStream`, `req`).
2.  **Writable:** Destination (e.g., `fs.createWriteStream`, `res`).
3.  **Transform:** Modifies data as it passes through (e.g., Compression `zlib`, Encryption).

### Example: Proxying a Stream
If you need to pass a video from S3 to the Client without downloading it first.

```javascript
app.get('/video', (req, res) => {
    const s3Stream = s3.getObject({ Bucket: '...', Key: 'video.mp4' }).createReadStream();
    
    // Pipe S3 -> Response
    // User watches immediately. Server RAM stays low.
    s3Stream.pipe(res);
});
```

### Events to Know
*   `data`: "Here is a chunk of data."
*   `end`: "No more data coming."
*   `error`: "Something broke."
*   `pipe`: "Someone connected a pipe to me."

---

## 4. Visualizing the Buffer
Think of a Buffer as a fixed-length array of integers (0-255).

```javascript
// A buffer of 4 bytes
const buf = Buffer.alloc(4);
buf[0] = 0x48; // 'H'
buf[1] = 0x69; // 'i'
console.log(buf); // <Buffer 48 69 00 00>
```

In StreamForge, you rarely manipulate individual bytes. You usually pass these buffers blindly from Input to Output.