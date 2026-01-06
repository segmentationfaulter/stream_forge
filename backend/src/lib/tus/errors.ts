export class TusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TusError";
  }
}

export class UploadNotFoundError extends TusError {
  constructor(id: string) {
    super(`Upload not found: ${id}`);
    this.name = "UploadNotFoundError";
  }
}

export class OffsetMismatchError extends TusError {
  constructor(expected: number, actual: number) {
    super(`Offset mismatch: expected ${expected}, got ${actual}`);
    this.name = "OffsetMismatchError";
  }
}

export class UploadSizeExceededError extends TusError {
  constructor(max: number) {
    super(`Upload size exceeded: max ${max}`);
    this.name = "UploadSizeExceededError";
  }
}

export class FileLockedError extends TusError {
  constructor(id: string) {
    super(`File is currently locked: ${id}`);
    this.name = "FileLockedError";
  }
}
