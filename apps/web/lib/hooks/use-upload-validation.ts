"use client";

import { formatFileSize } from "@/lib/utils";
import type { UserStorageDetails } from "./use-user-storage";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalSize: number;
  fileCount: number;
  oversizedFiles: Array<{
    name: string;
    size: number;
    formattedSize: string;
  }>;
}

export interface ValidationConfig {
  maxIndividualFileSize?: number; // Optional - undefined means no limit
  maxBatchSize: number;
  maxBatchTotalSize?: number; // Optional - undefined means no limit
  storageBuffer: number;
}

/**
 * Validates files before upload to prevent storage limit violations
 * and provide immediate user feedback
 */
export function validateFilesBeforeUpload(
  files: File[],
  userStorage: UserStorageDetails,
  config: ValidationConfig,
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    totalSize: 0,
    fileCount: files.length,
    oversizedFiles: [],
  };

  // 1. Check if we have storage data
  if (!userStorage) {
    result.errors.push("Unable to verify storage limits. Please try again.");
    result.isValid = false;
    return result;
  }

  // 2. Check file count limit
  if (files.length > config.maxBatchSize) {
    result.errors.push(
      `Too many files selected. Maximum: ${config.maxBatchSize} files per upload.`,
    );
    result.isValid = false;
  }

  // 3. Calculate total size and check individual file sizes (if limit exists)
  for (const file of files) {
    result.totalSize += file.size;

    // Only check individual file size if a limit is configured
    if (
      config.maxIndividualFileSize &&
      file.size > config.maxIndividualFileSize
    ) {
      const formattedSize = formatFileSize(file.size);
      result.oversizedFiles.push({
        name: file.name,
        size: file.size,
        formattedSize,
      });
      result.errors.push(
        `File "${file.name}" is too large (${formattedSize}). Maximum: ${formatFileSize(config.maxIndividualFileSize)}`,
      );
      result.isValid = false;
    }
  }

  // 4. Check batch total size (if limit exists)
  if (config.maxBatchTotalSize && result.totalSize > config.maxBatchTotalSize) {
    result.errors.push(
      `Total upload size too large (${formatFileSize(result.totalSize)}). Maximum: ${formatFileSize(config.maxBatchTotalSize)} per batch.`,
    );
    result.isValid = false;
  }

  // 5. Check user storage limit
  const availableStorage = userStorage.storageLimit - userStorage.storageUsed;
  const requiredStorage = result.totalSize + config.storageBuffer;

  if (requiredStorage > availableStorage) {
    result.errors.push(
      `Insufficient storage space. Required: ${formatFileSize(requiredStorage)}, Available: ${formatFileSize(availableStorage)}`,
    );
    result.isValid = false;
  }

  // 6. Add warnings for performance considerations
  if (files.length > 50) {
    result.warnings.push(
      `Uploading ${files.length} files. Consider uploading in smaller batches for better performance.`,
    );
  }

  // 7. Storage usage warning (approaching limit)
  const usagePercentage =
    ((userStorage.storageUsed + result.totalSize) / userStorage.storageLimit) *
    100;
  if (usagePercentage > 80 && usagePercentage <= 100) {
    result.warnings.push(
      `This upload will use ${Math.round(usagePercentage)}% of your storage limit.`,
    );
  }

  return result;
}

/**
 * Get validation configuration based on environment and user type
 * No hard file size limits - only storage plan limits apply
 */
export function getValidationConfig(): ValidationConfig {
  return {
    // No individual file size limit - users can upload any size file
    maxIndividualFileSize: undefined,
    // Reasonable batch size to prevent UI performance issues
    maxBatchSize: 100,
    // No batch total size limit - only user's storage limit applies
    maxBatchTotalSize: undefined,
    // Small buffer for metadata/overhead
    storageBuffer: 100 * 1024 * 1024, // 100MB buffer
  };
}
