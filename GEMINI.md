# StreamForge Project Context

## 1. Project Overview

**StreamForge** is an educational yet production-grade video streaming platform designed to replicate the backend engineering challenges of services like YouTube or Twitch.

**Core Mission:** To bridge the gap between "Web Development" (REST APIs, JSON) and "Systems Engineering" (Binary streams, Process orchestration, I/O efficiency).

## 2. Repository Status: Implementation Phase (Phase 1)

The specification and architectural planning phases are complete. We are now entering the implementation phase.

- **Current Focus:** Phase 1 (The Pipeline) - Milestone 6: Production Polish.
- **Status:** Milestone 5 complete. CLI verified with sample video; HLS output generated and validated.

## 3. Technical Architecture

The system is designed with a **Unified Modular Monolith** architecture:

| Component    | Technology       | Responsibility                                                                          |
| :----------- | :--------------- | :-------------------------------------------------------------------------------------- |
| **Backend**  | **Bun + SQLite** | **All-in-One:** API, Database, TUS Upload Server, FFmpeg Orchestration, Static Serving. |
| **Frontend** | **React + TS**   | Smart Upload Client (TUS), Adaptive Video Player (HLS).                                 |
| **Storage**  | **Local FS**     | Structured storage for temp chunks, raw video, and processed HLS segments.              |

## 4. Key Documentation (Reading Order)

> [!IMPORTANT]
> The `spec.md` file is the **official specification** for this project and the **ultimate source of truth** for all requirements and implementation details.
>
> All documentation located in the `docs/` directory is for **educational purposes only**. These files are intended for personal learning and should **not** influence or dictate the project's official design, architecture, or implementation.

## 5. Development Roadmap

The project is divided into 4 distinct execution phases:

- **Phase 1: The Pipeline (Bun)** - Build a CLI tool to transcode files to HLS using FFmpeg. [View Plan](plans/phase-1.md)
- **Phase 2: The Ingest (Bun)** - Implement a TUS-compliant HTTP server for resumable uploads.
- **Phase 3: Integration** - Connect Uploads -> Processing.
- **Phase 4: The Experience (React)** - Build the user-facing web app.

## 6. Usage

As an AI agent or Developer, use this repository to:

1.  Understand the constraints of "Binary Data Handling" and "Efficient I/O".
2.  Reference the `spec.md` as the **ultimate source of truth** when making architectural decisions or implementing features.

## 7. Coding Conventions & Procedural Rules

- **Functional over Object-Oriented:** Avoid JavaScript Classes where possible. Prefer simple functions, closures, and type aliases. Use Classes only when managing complex stateful lifecycles (e.g., a wrapping a child process) is significantly cleaner than the functional alternative.
- **Type Aliases over Interfaces:** Prefer `type` aliases over `interface` for defining data structures and function signatures.
- **Type Safety:** Strict TypeScript usage is required.
- **Bun Version & Tooling:** Use Bun version 1.3.5. Always initialize new Bun projects or components using official `bun init` or `bun create` commands, selecting the one that best fits the specific use case.
- **Self-Contained Milestones:** Every milestone must be designed to be self-contained and independently testable.
- **Milestone Isolation:** When implementing a milestone, strictly focus on the requirements of that specific milestone. Do not implement logic intended for future milestones.
- **Explicit Approval Required:** Do not begin the implementation of any milestone until the user has given an explicit go-ahead for it.
- **Iterative Planning:** Each phase must be divided into manageable, testable milestones before implementation begins.
- **Update Status:** Always update GEMINI.md with the latest project status after completing a milestone.
- **Documentation:** Add extensive documentation to any critical piece of code as comments.
- **Centralized Configuration:** Any piece of code needing to use profiles should look in `backend/src/config.ts`.

