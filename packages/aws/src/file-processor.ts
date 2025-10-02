import {
  abortChunkedUpload,
  completeChunkedUpload,
  deleteFile,
  downloadFile,
  downloadFileRange,
  downloadFileStream,
  generateDownloadUrl,
  generateUploadUrl,
  getFileMetadata,
  initializeChunkedUpload,
  uploadChunk,
  uploadFileAuto,
  type ChunkedUploadPart,
  type FileMetadata,
} from "./s3";
import {
  detectMaliciousPatterns,
  detectMimeTypeSmart,
  generateFileKey,
  getMimeType,
  validateContentType,
  validateFileSize,
  validateFileType,
} from "./utils";

export interface ProcessedFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface FileProcessorOptions {
  maxFileSize?: number; // in bytes
  allowedTypes?: string[]; // file extensions like ['.pdf', '.jpg']
  generateThumbnail?: boolean;
}

export class FileProcessor {
  private options: FileProcessorOptions;

  constructor(options: FileProcessorOptions = {}) {
    this.options = {
      maxFileSize: undefined, // No file size limit by default - only user storage limits apply
      allowedTypes: undefined, // Allow all types by default
      generateThumbnail: false,
      ...options,
    };
  }

  // Upload and process file
  async uploadAndProcess(
    buffer: Buffer,
    originalName: string,
    userId: string
  ): Promise<ProcessedFile> {
    // Validate file size (only if a limit is configured)
    if (
      this.options.maxFileSize &&
      !validateFileSize(buffer.length, this.options.maxFileSize)
    ) {
      throw new Error(
        `File size exceeds limit of ${this.options.maxFileSize} bytes`
      );
    }

    // Validate file type
    if (!validateFileType(originalName, this.options.allowedTypes)) {
      throw new Error(
        `File type not allowed. Allowed types: ${this.options.allowedTypes?.join(
          ", "
        )}`
      );
    }

    // Smart MIME type detection with confidence scoring
    const smartDetection = detectMimeTypeSmart(buffer, originalName);
    const mimeType = smartDetection.mimeType;

    // Validate content matches detected type (prevent spoofing)
    const contentValidation = validateContentType(
      buffer,
      mimeType,
      originalName
    );
    if (!contentValidation.isValid) {
      throw new Error(`Content validation failed: ${contentValidation.reason}`);
    }

    // Check for malicious patterns
    if (detectMaliciousPatterns(buffer, mimeType)) {
      throw new Error("File contains potentially malicious content");
    }

    // Generate secure key
    const key = generateFileKey(userId, originalName);

    // Upload to S3 (automatically chooses single or multipart based on size)
    const result = await uploadFileAuto(buffer, key, mimeType);

    return {
      key: result.key,
      url: result.url,
      size: result.size,
      mimeType,
      originalName,
    };
  }

  // Download file (loads entire file into memory)
  async downloadFile(key: string): Promise<Buffer> {
    return await downloadFile(key);
  }

  // Download file as stream (for large files)
  async downloadFileStream(key: string): Promise<ReadableStream<Uint8Array>> {
    return await downloadFileStream(key);
  }

  // Download file range (partial download)
  async downloadFileRange(
    key: string,
    start: number,
    end?: number
  ): Promise<Buffer> {
    return await downloadFileRange(key, start, end);
  }

  // Delete file
  async deleteFile(key: string): Promise<void> {
    await deleteFile(key);
  }

  // Get file metadata
  async getFileInfo(key: string): Promise<FileMetadata> {
    return await getFileMetadata(key);
  }

  // Generate presigned upload URL
  async generateUploadUrl(
    userId: string,
    originalName: string,
    expiresIn = 3600
  ): Promise<{ uploadUrl: string; key: string }> {
    const key = generateFileKey(userId, originalName);
    const mimeType = getMimeType(originalName);
    const uploadUrl = await generateUploadUrl(key, mimeType, expiresIn);

    return { uploadUrl, key };
  }

  // Generate presigned download URL
  async generateDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    return await generateDownloadUrl(key, expiresIn);
  }

  // Batch delete files (optimized for large batches)
  async deleteFiles(keys: string[]): Promise<{
    deleted: string[];
    errors: Array<{ key: string; error: string }>;
  }> {
    const { deleteFiles } = await import("./s3");
    return await deleteFiles(keys);
  }

  // Get user files (by prefix)
  async getUserFiles(userId: string): Promise<FileMetadata[]> {
    const { listFiles } = await import("./s3");
    return await listFiles(`files/${userId}/`);
  }

  // ============================================================================
  // CHUNKED UPLOAD METHODS (for large files)
  // ============================================================================

  // Process and upload file in chunks (for large files)
  async uploadAndProcessChunked(
    chunks: Buffer[],
    originalName: string,
    userId: string,
    uploadId: string,
    key: string
  ): Promise<ProcessedFile> {
    try {
      // Validate first chunk for file type and malicious patterns
      const firstChunk = chunks[0];
      if (!firstChunk) {
        throw new Error("No chunks provided");
      }

      // Smart MIME type detection using first chunk
      const smartDetection = detectMimeTypeSmart(firstChunk, originalName);
      const mimeType = smartDetection.mimeType;

      // Validate file type
      if (!validateFileType(originalName, this.options.allowedTypes)) {
        throw new Error(
          `File type not allowed. Allowed types: ${this.options.allowedTypes?.join(
            ", "
          )}`
        );
      }

      // Validate content matches detected type (using first chunk)
      const contentValidation = validateContentType(
        firstChunk,
        mimeType,
        originalName
      );
      if (!contentValidation.isValid) {
        throw new Error(
          `Content validation failed: ${contentValidation.reason}`
        );
      }

      // Check for malicious patterns in first chunk
      if (detectMaliciousPatterns(firstChunk, mimeType)) {
        throw new Error("File contains potentially malicious content");
      }

      // Upload all chunks to S3
      const parts: ChunkedUploadPart[] = [];
      let totalSize = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const partNumber = i + 1; // S3 parts start at 1

        const part = await uploadChunk(uploadId, key, partNumber, chunk);
        parts.push(part);
        totalSize += chunk.length;
      }

      // Complete the multipart upload
      const result = await completeChunkedUpload(uploadId, key, parts);

      return {
        key: result.key,
        url: result.url,
        size: totalSize, // Use actual calculated size
        mimeType,
        originalName,
      };
    } catch (error) {
      // Clean up failed upload
      try {
        await abortChunkedUpload(uploadId, key);
      } catch (cleanupError) {
        console.error("Failed to cleanup chunked upload:", cleanupError);
      }
      throw error;
    }
  }

  // Initialize a chunked upload session
  async initializeChunkedUpload(
    originalName: string,
    userId: string
  ): Promise<{ uploadId: string; key: string }> {
    const key = generateFileKey(userId, originalName);
    const mimeType = getMimeType(originalName);
    const uploadId = await initializeChunkedUpload(key, mimeType);

    return { uploadId, key };
  }

  // Abort a chunked upload (cleanup)
  async abortChunkedUpload(uploadId: string, key: string): Promise<void> {
    await abortChunkedUpload(uploadId, key);
  }
}

// Default instance with no file size limits - only user storage limits apply
export const fileProcessor = new FileProcessor({
  maxFileSize: undefined, // No hard limit
});

// Specialized processors (with type restrictions but no size limits)
export const imageProcessor = new FileProcessor({
  allowedTypes: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
  maxFileSize: undefined, // No size limit - only user storage limits apply
});

export const documentProcessor = new FileProcessor({
  allowedTypes: [".pdf", ".doc", ".docx", ".txt", ".csv"],
  maxFileSize: undefined, // No size limit - only user storage limits apply
});
