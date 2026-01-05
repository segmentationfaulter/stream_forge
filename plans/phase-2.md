# Phase 2: The Ingest (Library-First TUS)

**Goal:** Implement a modular, protocol-compliant TUS server in Bun that is decoupled from the main application logic, making it suitable for future extraction as a standalone npm package.

## Milestone 1: Architecture & Contracts
- [ ] Define the `DataStore` interface (`src/lib/tus/interfaces/DataStore.ts`) - the contract for storage drivers (create, append, getStat, etc.).
- [ ] Define `TusConfig` and `TusRequest/Response` types (`src/lib/tus/types.ts`) to ensure framework agnosticism.
- [ ] Create the `TusServer` class skeleton (`src/lib/tus/index.ts`) - the main entry point that dispatches requests to handlers.

## Milestone 2: The Storage Driver
- [ ] Implement `FileStore` class (`src/lib/tus/stores/FileStore.ts`) implementing `DataStore`.
- [ ] Implement file locking mechanism within `FileStore` to ensure concurrency safety.
- [ ] Ensure `FileStore` handles `Bun.file()` and streams efficiently using non-blocking I/O.

## Milestone 3: Protocol Core (POST & HEAD)
- [ ] Implement `handlePost` - generic logic for creating uploads, validating headers, and calling `store.create()`.
- [ ] Implement `handleHead` - generic logic for checking status, calling `store.getStat()`.
- [ ] Ensure strict TUS header compliance (e.g., `Tus-Resumable`, `Upload-Length`, `Upload-Offset`).

## Milestone 4: The Upload Mechanism (PATCH)
- [ ] Implement `handlePatch` - generic logic for appending chunks.
- [ ] Validate `Upload-Offset` against current storage size.
- [ ] Call `store.append()` with the request body stream.
- [ ] Handle error states (e.g., offset mismatch, lock contention).

## Milestone 5: Integration & Verification
- [ ] Integrate `TusServer` into the main `src/server.ts` application.
- [ ] Configure it with `FileStore` pointing to `storage/temp/`.
- [ ] Create `scripts/test-upload.ts` to verify full upload lifecycle (Start -> Pause -> Resume -> Complete) using a standard TUS client library.