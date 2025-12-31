# StreamForge: Adaptive Bitrate Video Streaming Platform - Project Specification

## 1. Project Overview
StreamForge is a high-performance video streaming platform designed to replicate the core backend engineering challenges of services like YouTube or Twitch. The primary goal is to move beyond simple REST APIs and tackle low-level systems programming concepts: handling massive binary data streams, managing long-running processes, and ensuring efficient I/O operations.

The system will allow users to upload large video files reliably (even over poor connections), automatically transcode them into multiple resolutions (Adaptive Bitrate Streaming), and stream them back to clients using HLS (HTTP Live Streaming) for a seamless playback experience.

## 2. Core Learning Objectives
This project is engineered to bridge the gap between "Web Developer" and "Systems Engineer" by enforcing the following technical constraints:
*   **Binary Data Handling:** Transitioning from manipulating JSON strings to managing raw bytes, buffers, and streams.
*   **Efficient I/O:** Implementing non-blocking pipelines where data flows through the system (Network -> Memory -> Disk -> Process) without exploding RAM usage.
*   **Process Orchestration:** Managing external system binaries (FFmpeg) programmatically, handling standard streams (stdin/stdout/stderr), and monitoring process health.
*   **Protocol Implementation:** Adhering to strict industry standards (TUS for uploads, HLS for delivery) rather than inventing custom solutions.

## 3. Functional Requirements

### 3.1. Video Ingestion (The Upload Layer)
*   **Resumable Uploads:** The system must support pausing and resuming uploads. If a user loses internet connection at 99%, they should not have to restart from 0%.
*   **Chunked Transfer:** Large files (e.g., 5GB+) must be uploaded in small chunks to prevent server memory exhaustion and connection timeouts.
*   **Concurrent Uploads:** The server must handle multiple simultaneous upload streams from different users without blocking.

### 3.2. Video Processing (The Transcoding Layer)
*   **Format Normalization:** Ingested videos (which may be `.mov`, `.avi`, `.mkv`) must be converted to a standardized web-ready container (MP4/TS).
*   **Adaptive Bitrate Generation:** The system must generate multiple quality variants for every uploaded video:
    *   **1080p (High)**
    *   **720p (Medium)**
    *   **480p (Low)**
    *   **360p (Mobile)**
*   **HLS Segmentation:** The video must be sliced into small time-based chunks (segments) and indexed via an `.m3u8` playlist file.
*   **Pipeline Processing:** Processing should ideally begin as soon as enough data is buffered, rather than waiting for the entire upload to finish (Stream-based processing).

### 3.3. Content Delivery (The Streaming Layer)
*   **Adaptive Playback:** The backend must serve the correct `.m3u8` playlists allowing the client player to switch resolution based on network bandwidth.
*   **Range Requests:** Support for HTTP Range headers to allow seeking to specific parts of a video file efficiently.

### 3.4. User Interface
*   **Dashboard:** A view to manage uploaded videos and see their processing status (Queued, Processing, Ready, Failed).
*   **Smart Uploader:** A UI component that handles file chunking, progress visualization, and auto-retry logic on network failure.
*   **Adaptive Player:** A custom video player capable of consuming HLS streams and providing manual quality selection controls.

## 4. Technical Architecture & Stack Strategy

### 4.1. The "Control Plane" (Node.js)
*   **Role:** Acts as the brain of the operation. Handles lightweight, I/O-bound tasks.
*   **Responsibilities:**
    *   User Authentication & Authorization.
    *   Video Metadata Management (Title, Description, Duration).
    *   Orchestrating the upload lifecycle (handshaking with the upload client).
    *   Serving the Frontend application.

### 4.2. The "Data Plane" (Golang)
*   **Role:** The heavy lifter. Handles CPU-intensive and memory-sensitive tasks.
*   **Responsibilities:**
    *   **Ingestion Server:** Implementing the TUS protocol server-side to receive binary chunks and assemble them.
    *   **Transcoding Engine:** A worker pool that manages FFmpeg subprocesses. It feeds raw video data into FFmpeg and pipes the output to storage.
    *   **Stream Delivery:** A high-performance static file server optimized for serving `.ts` segments and playlists.

### 4.3. Storage Layer
*   **Raw Storage:** A structured local filesystem directory (mimicking an Object Store structure like S3 buckets).
    *   `temp/`: For partial chunks during upload.
    *   `raw/`: For the assembled master file.
    *   `processed/{video_id}/`: For the HLS playlists and segments.

### 4.4. Frontend (React + TypeScript)
*   **Upload Client:** Usage of a specialized TUS client library to handle the complexity of chunking and retries.
*   **Video Player:** Integration with a video framework (e.g., Video.js) that supports HLS playback natively.

## 5. Key Protocols & Standards

### 5.1. TUS (Resumable Upload Protocol)
Instead of a simple `POST`, the system will implement the TUS open protocol:
1.  **POST:** Create a new upload resource.
2.  **HEAD:** Check the offset of an interrupted upload.
3.  **PATCH:** Upload a chunk of bytes to a specific offset.

### 5.2. HLS (HTTP Live Streaming)
The standard for modern video delivery.
*   **Master Playlist:** Lists available quality levels (bandwidth, resolution).
*   **Media Playlists:** Lists the actual file segments for a specific quality.
*   **MPEG-TS:** The container format for the individual video segments.

### 5.3. FFmpeg
The core engine for video manipulation. We will not write video encoding logic from scratch (that is a PhD level task). Instead, we will wrap FFmpeg and control it via:
*   **Stdin:** Piping input data.
*   **Stdout:** Capturing output logs or data.
*   **Signal Handling:** Gracefully stopping or pausing transcoding jobs.

## 6. Development Phases

1.  **Phase 1: The Pipeline:** Build the Golang CLI tool that takes a file, runs FFmpeg, and outputs HLS segments. This proves the core logic works without a web server.
2.  **Phase 2: The Ingest:** Implement the TUS server in Golang to accept file uploads via HTTP.
3.  **Phase 3: Integration:** Connect the Upload to the Processing pipeline.
4.  **Phase 4: The Experience:** Build the React frontend and Node.js API to manage the library.
