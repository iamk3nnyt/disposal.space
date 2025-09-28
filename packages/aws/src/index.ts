// Configuration
export * from "./config";

// S3 operations
export * from "./s3";

// File processing
export * from "./file-processor";

// Utilities
export * from "./utils";

// Export specific functions for convenience
export {
  deleteFile,
  deleteFiles,
  downloadFile,
  downloadFileRange,
  downloadFileStream,
  generateDownloadUrl,
  generateUploadUrl,
  uploadFile,
  uploadFileAuto,
  uploadLargeFile,
} from "./s3";

// Export utility functions for convenience
export {
  detectMaliciousPatterns,
  detectMimeTypeSmart,
  getFileExtension,
  getFileTypeCategory,
  getMimeType,
  validateContentType,
} from "./utils";
