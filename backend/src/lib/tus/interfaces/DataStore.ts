export type UploadStat = {
  /**
   * Current number of bytes uploaded so far.
   */
  offset: number;
  /**
   * Total size of the file as declared in the creation (POST) request.
   * Can be null if size was not deferred.
   */
  size: number | null;
  /**
   * Encoded metadata string from TUS.
   */
  metadata?: string;
};

export type DataStore = {
  /**
   * Creates a new upload resource.
   */
  create(id: string, size: number | null, metadata?: string): Promise<void>;

  /**
   * Appends data to an existing upload resource.
   * Returns the new offset after appending.
   */
  append(id: string, data: ReadableStream, offset: number): Promise<number>;

  /**
   * Retrieves status of an upload resource.
   */
  getStat(id: string): Promise<UploadStat>;

  /**
   * Ensures an upload is not being modified by another request.
   */
  lock(id: string): Promise<void>;

  /**
   * Releases the lock on an upload resource.
   */
  unlock(id: string): Promise<void>;

  /**
   * Checks if an upload exists.
   */
  exists(id: string): Promise<boolean>;
};
