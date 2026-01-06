import type { DataStore, UploadStat } from "../interfaces/DataStore";
import { join } from "node:path";
import { mkdir, unlink, open } from "node:fs/promises";
import {
  UploadNotFoundError,
  OffsetMismatchError,
  FileLockedError,
  UploadSizeExceededError,
} from "../errors";

export type FileStoreConfig = {
  directory: string;
};

/**
 * Creates a FileStore for TUS uploads using the local filesystem.
 *
 * Uses Bun.file and Bun.write for atomic metadata operations, and
 * node:fs streams for reliable, high-performance binary appending.
 */
export function createFileStore(config: FileStoreConfig): DataStore {
  const { directory } = config;

  const getUploadDir = (id: string) => join(directory, id);
  const getFilePath = (id: string) => join(getUploadDir(id), "upload.bin");
  const getMetaPath = (id: string) => join(getUploadDir(id), "metadata.json");
  const getLockPath = (id: string) => join(getUploadDir(id), "upload.lock");

  return {
    async create(
      id: string,
      size: number | null,
      metadata?: string,
    ): Promise<void> {
      // Create dedicated directory for this upload
      await mkdir(getUploadDir(id), { recursive: true });

      const meta: UploadStat = {
        offset: 0,
        size: size,
        metadata: metadata,
      };

      // Create empty binary file and write metadata
      // Bun.write is atomic and efficient
      await Promise.all([
        Bun.write(getFilePath(id), ""),
        Bun.write(getMetaPath(id), JSON.stringify(meta)),
      ]);
    },

    async append(
      id: string,
      data: ReadableStream,
      offset: number,
    ): Promise<number> {
      const filePath = getFilePath(id);
      const metaPath = getMetaPath(id);

      // 1. Validation
      const metaFile = Bun.file(metaPath);
      if (!(await metaFile.exists())) {
        throw new UploadNotFoundError(id);
      }

      const currentMeta: UploadStat = await metaFile.json();
      if (currentMeta.offset !== offset) {
        throw new OffsetMismatchError(currentMeta.offset, offset);
      }

      // 2. High-Performance Appending
      const { createWriteStream } = await import("node:fs");
      const writeStream = createWriteStream(filePath, { flags: "a" });

      let bytesWritten = 0;

      try {
        for await (const chunk of data) {
          // Check for size exceeded BEFORE writing
          if (currentMeta.size !== null) {
            if (
              currentMeta.offset + bytesWritten + chunk.length >
              currentMeta.size
            ) {
              throw new UploadSizeExceededError(currentMeta.size);
            }
          }

          const canWrite = writeStream.write(chunk);
          bytesWritten += chunk.length;

          if (!canWrite) {
            await new Promise((resolve) => writeStream.once("drain", resolve));
          }
        }
      } catch (err) {
        // Ensure we close stream on error before rethrowing
        await new Promise((resolve) => writeStream.end(resolve));
        throw err;
      } finally {
        // Ensure stream is closed normally
        if (!writeStream.destroyed && !writeStream.writableEnded) {
          await new Promise((resolve) => writeStream.end(resolve));
        }
      }

      // 3. Update Metadata
      const newOffset = currentMeta.offset + bytesWritten;
      currentMeta.offset = newOffset;
      await Bun.write(metaPath, JSON.stringify(currentMeta));

      return newOffset;
    },

    async getStat(id: string): Promise<UploadStat> {
      const metaPath = getMetaPath(id);
      const file = Bun.file(metaPath);
      if (!(await file.exists())) {
        throw new UploadNotFoundError(id);
      }
      return await file.json();
    },

    /**
     * Acquires an exclusive lock for an upload resource.
     * 
     * Rationale: Prevents race conditions where multiple concurrent PATCH requests 
     * might attempt to append to the same file simultaneously.
     * 
     * Mechanism:
     * 1. Uses 'wx' flag (exclusive create) to atomically create a lock file.
     * 2. If file exists -> Throws FileLockedError (Another request is writing).
     * 3. If directory missing -> Throws UploadNotFoundError (Upload ID invalid).
     */
    async lock(id: string): Promise<void> {
      const lockPath = getLockPath(id);
      try {
        // 'wx' flag: open for writing, fails if file exists (atomic)
        // Also fails if the directory doesn't exist (ENOENT)
        const handle = await open(lockPath, "wx");
        await handle.close();
      } catch (error: any) {
        if (error.code === "EEXIST") {
          throw new FileLockedError(id);
        }
        if (error.code === "ENOENT") {
          throw new UploadNotFoundError(id);
        }
        throw error;
      }
    },

    /**
     * Releases the exclusive lock for an upload resource.
     */
    async unlock(id: string): Promise<void> {
      const lockPath = getLockPath(id);
      try {
        await unlink(lockPath);
      } catch (e) {
        // Ignore errors (e.g., file already deleted by another process or cleanup)
      }
    },

    async exists(id: string): Promise<boolean> {
      return await Bun.file(getMetaPath(id)).exists();
    },
  };
}
