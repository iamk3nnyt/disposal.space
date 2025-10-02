import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { awsConfig, validateConfig } from "./config";

// Initialize S3 client
validateConfig();

const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  },
});

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

export interface FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

export interface ChunkedUploadPart {
  ETag: string;
  PartNumber: number;
}

// Upload file to S3
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType?: string
): Promise<UploadResult> {
  try {
    const command = new PutObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    return {
      key,
      url: `https://${awsConfig.bucketName}.s3.${awsConfig.region}.amazonaws.com/${key}`,
      size: buffer.length,
    };
  } catch (error) {
    throw new Error(`Failed to upload file: ${error}`);
  }
}

// Download file from S3 (loads entire file into memory)
export async function downloadFile(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("No file content received");
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    throw new Error(`Failed to download file: ${error}`);
  }
}

// Stream download for large files (returns readable stream)
export async function downloadFileStream(
  key: string
): Promise<ReadableStream<Uint8Array>> {
  try {
    const command = new GetObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("No file content received");
    }

    return response.Body.transformToWebStream();
  } catch (error) {
    throw new Error(`Failed to download file stream: ${error}`);
  }
}

// Download file with range support (partial downloads)
export async function downloadFileRange(
  key: string,
  start: number,
  end?: number
): Promise<Buffer> {
  try {
    const range = end ? `bytes=${start}-${end}` : `bytes=${start}-`;

    const command = new GetObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
      Range: range,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("No file content received");
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    throw new Error(`Failed to download file range: ${error}`);
  }
}

// Delete file from S3
export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    throw new Error(`Failed to delete file: ${error}`);
  }
}

// Batch delete files from S3 (up to 1000 files per call)
export async function deleteFiles(keys: string[]): Promise<{
  deleted: string[];
  errors: Array<{ key: string; error: string }>;
}> {
  if (keys.length === 0) {
    return { deleted: [], errors: [] };
  }

  const results = {
    deleted: [] as string[],
    errors: [] as Array<{ key: string; error: string }>,
  };

  // AWS S3 supports up to 1000 objects per batch delete
  const batchSize = 1000;

  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);

    try {
      const command = new DeleteObjectsCommand({
        Bucket: awsConfig.bucketName,
        Delete: {
          Objects: batch.map((key) => ({ Key: key })),
          Quiet: false, // Return info about deleted objects
        },
      });

      const response = await s3Client.send(command);

      // Track successful deletions
      if (response.Deleted) {
        results.deleted.push(
          ...response.Deleted.map((obj) => obj.Key!).filter(Boolean)
        );
      }

      // Track errors
      if (response.Errors) {
        results.errors.push(
          ...response.Errors.map((err) => ({
            key: err.Key!,
            error: `${err.Code}: ${err.Message}`,
          }))
        );
      }
    } catch (error) {
      // If entire batch fails, mark all keys as errors
      results.errors.push(
        ...batch.map((key) => ({
          key,
          error: `Batch deletion failed: ${error}`,
        }))
      );
    }
  }

  return results;
}

// Get file metadata
export async function getFileMetadata(key: string): Promise<FileMetadata> {
  try {
    const command = new HeadObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    return {
      key,
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType,
    };
  } catch (error) {
    throw new Error(`Failed to get file metadata: ${error}`);
  }
}

// Generate presigned URL for direct upload
export async function generateUploadUrl(
  key: string,
  contentType?: string,
  expiresIn = 3600
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    throw new Error(`Failed to generate upload URL: ${error}`);
  }
}

// Generate presigned URL for download
export async function generateDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    throw new Error(`Failed to generate download URL: ${error}`);
  }
}

// List files with prefix
export async function listFiles(prefix?: string): Promise<FileMetadata[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: awsConfig.bucketName,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    return (response.Contents || []).map((object) => ({
      key: object.Key || "",
      size: object.Size || 0,
      lastModified: object.LastModified || new Date(),
    }));
  } catch (error) {
    throw new Error(`Failed to list files: ${error}`);
  }
}

// Multipart upload for large files
export async function uploadLargeFile(
  buffer: Buffer,
  key: string,
  contentType?: string,
  partSize = 5 * 1024 * 1024 // 5MB parts (minimum for S3)
): Promise<UploadResult> {
  try {
    // Create multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const createResponse = await s3Client.send(createCommand);
    const uploadId = createResponse.UploadId;

    if (!uploadId) {
      throw new Error("Failed to create multipart upload");
    }

    // Upload parts
    const parts = [];
    const totalParts = Math.ceil(buffer.length / partSize);

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, buffer.length);
      const partBuffer = buffer.subarray(start, end);

      const uploadPartCommand = new UploadPartCommand({
        Bucket: awsConfig.bucketName,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: partBuffer,
      });

      const partResponse = await s3Client.send(uploadPartCommand);
      parts.push({
        ETag: partResponse.ETag,
        PartNumber: partNumber,
      });
    }

    // Complete multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    await s3Client.send(completeCommand);

    return {
      key,
      url: `https://${awsConfig.bucketName}.s3.${awsConfig.region}.amazonaws.com/${key}`,
      size: buffer.length,
    };
  } catch (error) {
    throw new Error(`Failed to upload large file: ${error}`);
  }
}

// Smart upload - automatically chooses single or multipart based on size
export async function uploadFileAuto(
  buffer: Buffer,
  key: string,
  contentType?: string,
  multipartThreshold = 100 * 1024 * 1024 // 100MB threshold
): Promise<UploadResult> {
  if (buffer.length > multipartThreshold) {
    return uploadLargeFile(buffer, key, contentType);
  } else {
    return uploadFile(buffer, key, contentType);
  }
}

// ============================================================================
// CHUNKED UPLOAD FUNCTIONS (for ETag tracker approach)
// ============================================================================

// Initialize a chunked upload session
export async function initializeChunkedUpload(
  key: string,
  contentType?: string
): Promise<string> {
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const response = await s3Client.send(command);

    if (!response.UploadId) {
      throw new Error("Failed to initialize chunked upload");
    }

    return response.UploadId;
  } catch (error) {
    throw new Error(`Failed to initialize chunked upload: ${error}`);
  }
}

// Upload a single chunk
export async function uploadChunk(
  uploadId: string,
  key: string,
  partNumber: number,
  buffer: Buffer
): Promise<ChunkedUploadPart> {
  try {
    const command = new UploadPartCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
      PartNumber: partNumber,
      UploadId: uploadId,
      Body: buffer,
    });

    const response = await s3Client.send(command);

    if (!response.ETag) {
      throw new Error("Failed to get ETag from chunk upload");
    }

    return {
      ETag: response.ETag,
      PartNumber: partNumber,
    };
  } catch (error) {
    throw new Error(`Failed to upload chunk ${partNumber}: ${error}`);
  }
}

// Complete a chunked upload
export async function completeChunkedUpload(
  uploadId: string,
  key: string,
  parts: ChunkedUploadPart[]
): Promise<UploadResult> {
  try {
    // Sort parts by PartNumber to ensure correct order
    const sortedParts = parts.sort((a, b) => a.PartNumber - b.PartNumber);

    const command = new CompleteMultipartUploadCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    });

    const response = await s3Client.send(command);

    // Calculate total size from parts (approximate)
    const totalSize = parts.length * 5 * 1024 * 1024; // Rough estimate

    return {
      key,
      url:
        response.Location ||
        `https://${awsConfig.bucketName}.s3.${awsConfig.region}.amazonaws.com/${key}`,
      size: totalSize,
    };
  } catch (error) {
    throw new Error(`Failed to complete chunked upload: ${error}`);
  }
}

// Abort a chunked upload (cleanup)
export async function abortChunkedUpload(
  uploadId: string,
  key: string
): Promise<void> {
  try {
    const command = new AbortMultipartUploadCommand({
      Bucket: awsConfig.bucketName,
      Key: key,
      UploadId: uploadId,
    });

    await s3Client.send(command);
  } catch (error) {
    throw new Error(`Failed to abort chunked upload: ${error}`);
  }
}
