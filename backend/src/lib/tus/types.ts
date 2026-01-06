import type { DataStore } from "./interfaces/DataStore";

export type TusConfig = {
  /**
   * The endpoint where the TUS server is mounted (e.g., "/api/upload").
   */
  path: string;
  /**
   * The storage driver implementation.
   */
  datastore: DataStore;
  /**
   * Maximum allowed file size in bytes.
   */
  maxSize?: number;
  /**
   * Function to generate unique IDs for uploads.
   */
  namingFunction?: () => string;
};

export type TusResponse = {
  status: number;
  headers?: Record<string, string>;
  body?: string | ReadableStream;
};
