# Phase 2: The Ingest (Plan)

**Goal:** Implement a TUS-compliant HTTP server using Bun that supports resumable, chunked file uploads. This replaces standard `multipart/form-data` uploads with a robust protocol capable of handling unstable network connections.

## Milestone 1: Server Skeleton & TUS Creation (POST)
- [ ] Create `src/server.ts` as the main HTTP entry point.
- [ ] Implement a basic Bun HTTP server (`Bun.serve`).
- [ ] Create `src/lib/tus/handler.ts` to manage TUS logic.
- [ ] Implement the **POST** handler:
    - [ ] Generate unique Upload IDs (UUID).
    - [ ] Read `Upload-Length` and `Upload-Metadata` headers.
    - [ ] Create empty files (`.bin` and `.json` metadata) in `storage/uploads/`.
    - [ ] Return `201 Created` with the `Location` header.

## Milestone 2: The Upload Mechanism (PATCH)
- [ ] Implement the **PATCH** handler in `src/lib/tus/handler.ts`:
    - [ ] Validate `Upload-Offset` against the current file size on disk.
    - [ ] Stream the request body (binary chunk) and append it to the `.bin` file.
    - [ ] Update the `.json` metadata with the new offset.
    - [ ] Return `204 No Content` with the new `Upload-Offset`.
- [ ] **Critical:** Ensure using `Bun.file().writer()` or Node streams for efficient appending to avoid loading the whole file into RAM.

## Milestone 3: Resumability & Status (HEAD)
- [ ] Implement the **HEAD** handler:
    - [ ] Check if the Upload ID exists.
    - [ ] Read the current file size (offset) from disk.
    - [ ] Return `200 OK` with `Upload-Offset` and `Upload-Length` headers.
- [ ] **Why?** This allows clients to ask "Where did we leave off?" after a crash and resume exactly from that byte.

## Milestone 4: Safety & Concurrency (The Lock)
- [ ] Implement a simple File Locking mechanism (`src/lib/tus/lock.ts`):
    - [ ] Before writing to a file (PATCH), acquire a lock (e.g., create a `.lock` file).
    - [ ] If locked, return `423 Locked`.
    - [ ] Release lock after writing.
- [ ] **Why?** Prevents data corruption if a user (or two tabs) tries to patch the same file simultaneously.

## Milestone 5: Verification (The TUS Client)
- [ ] Create a simple test script `scripts/test-upload.ts` using a TUS client library (e.g., `tus-js-client`).
- [ ] Simulate an upload:
    - [ ] Start upload.
    - [ ] Interrupt (kill script).
    - [ ] Restart script -> Verify it resumes instead of restarting.
- [ ] Verify the final binary file on disk matches the source file hash.
