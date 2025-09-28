import {
  deleteFile,
  downloadFile,
  downloadFileRange,
  downloadFileStream,
  generateDownloadUrl,
  generateUploadUrl,
  getFileMetadata,
  uploadFileAuto,
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
      maxFileSize: 100 * 1024 * 1024, // 100MB default
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
    // Validate file size
    if (!validateFileSize(buffer.length, this.options.maxFileSize)) {
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
}

// Default instance with standard options
export const fileProcessor = new FileProcessor();

// Specialized processors
export const imageProcessor = new FileProcessor({
  allowedTypes: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
  maxFileSize: 10 * 1024 * 1024, // 10MB
});

export const documentProcessor = new FileProcessor({
  allowedTypes: [".pdf", ".doc", ".docx", ".txt", ".csv"],
  maxFileSize: 50 * 1024 * 1024, // 50MB
});
