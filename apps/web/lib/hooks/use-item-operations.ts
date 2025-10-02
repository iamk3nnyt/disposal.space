"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Types
export interface ItemDownloadResponse {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  expiresIn: number;
}

export interface ItemDeleteResponse {
  message: string;
  sizeFreed: number;
}

export interface ItemResponse {
  item: {
    id: string;
    name: string;
    type: string;
    size: string;
    lastModified: string;
    isFolder: boolean;
    sizeBytes: number;
  };
}

// Progress tracking types
export interface UploadProgress {
  fileName: string;
  progress: number;
  size: string;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
  isFolder?: boolean;
  fileCount?: {
    total: number;
    processed: number;
  };
}

export interface UploadError extends Error {
  fileName?: string;
  error: string;
}

// Items query types
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  isFolder: boolean;
  sizeBytes: number;
}

export interface UserStorage {
  storageUsed: number;
  storageLimit: number;
  storageUsedFormatted: string;
  storageUsedPercentage: number;
}

export interface ItemsResponse {
  items: FileItem[];
  user: UserStorage;
}

// Request types
export interface CreateItemRequest {
  name: string;
  type: "folder";
  parentId?: string;
}

export interface UpdateItemRequest {
  name?: string;
  parentId?: string;
}

// Download item directly (streams through API)
async function downloadItem(
  itemId: string,
  options?: {
    download?: boolean;
    preview?: boolean;
  },
): Promise<Blob> {
  const params = new URLSearchParams();
  if (options?.download) params.append("download", "true");
  if (options?.preview) params.append("preview", "true");

  const response = await fetch(`/api/items/${itemId}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to download item");
  }

  return response.blob();
}

// Get presigned download URL (for preview/direct access)
async function getItemPreviewUrl(
  itemId: string,
): Promise<ItemDownloadResponse> {
  const response = await fetch(`/api/items/${itemId}?preview=true`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get preview URL");
  }

  return response.json();
}

// Get item metadata
async function getItemMetadata(itemId: string): Promise<ItemResponse> {
  const response = await fetch(`/api/items/${itemId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get item metadata");
  }

  return response.json();
}

// Delete item permanently (remove from database and S3)
async function deleteItem(itemId: string): Promise<ItemDeleteResponse> {
  const response = await fetch(`/api/items/${itemId}?permanent=true`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete item");
  }

  return response.json();
}

// Utility function to trigger browser download
function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// React Query hooks
export function useItemDownload() {
  return useMutation<
    Blob,
    Error,
    {
      itemId: string;
      fileName: string;
      options?: { download?: boolean; preview?: boolean };
    }
  >({
    mutationFn: ({ itemId, options }) => downloadItem(itemId, options),
    onSuccess: (blob, variables) => {
      // Automatically trigger download if download option is true
      if (variables.options?.download !== false) {
        triggerDownload(blob, variables.fileName);
      }
    },
    onError: (error) => {
      console.error("Download failed:", error);
    },
  });
}

export function useItemPreview(itemId: string, enabled = true) {
  return useQuery<ItemDownloadResponse, Error>({
    queryKey: ["itemPreview", itemId],
    queryFn: () => getItemPreviewUrl(itemId),
    enabled: enabled && !!itemId,
    staleTime: 30 * 60 * 1000, // 30 minutes (URLs expire in 1 hour)
    retry: 1,
  });
}

export function useItemMetadata(itemId: string, enabled = true) {
  return useQuery<ItemResponse, Error>({
    queryKey: ["itemMetadata", itemId],
    queryFn: () => getItemMetadata(itemId),
    enabled: enabled && !!itemId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useItemDelete() {
  const queryClient = useQueryClient();

  return useMutation<
    ItemDeleteResponse,
    Error,
    {
      itemId: string;
    }
  >({
    mutationFn: ({ itemId }) => deleteItem(itemId),
    onSuccess: (data, variables) => {
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["folderChildren"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["user", "storage"] });

      // Remove specific item data since it's deleted
      queryClient.removeQueries({
        queryKey: ["itemPreview", variables.itemId],
      });
      queryClient.removeQueries({
        queryKey: ["itemMetadata", variables.itemId],
      });
    },
    onError: (error) => {
      console.error("Delete failed:", error);
    },
  });
}

// Hook for batch item operations
export function useBatchItemDownload() {
  return useMutation<
    Blob[],
    Error,
    {
      items: { itemId: string; fileName: string }[];
      options?: { download?: boolean; preview?: boolean };
    }
  >({
    mutationFn: async ({ items, options }) => {
      const downloadPromises = items.map(({ itemId }) =>
        downloadItem(itemId, options),
      );
      return Promise.all(downloadPromises);
    },
    onSuccess: (blobs, variables) => {
      // Trigger downloads for all items
      if (variables.options?.download !== false) {
        blobs.forEach((blob, index) => {
          const fileName = variables.items[index].fileName;
          triggerDownload(blob, fileName);
        });
      }
    },
    onError: (error) => {
      console.error("Batch download failed:", error);
    },
  });
}

// Hook for item preview with automatic URL management
export function useItemPreviewUrl(itemId: string, enabled = true) {
  const { data, isLoading, error } = useItemPreview(itemId, enabled);

  return {
    previewUrl: data?.url,
    fileName: data?.fileName,
    mimeType: data?.mimeType,
    size: data?.size,
    expiresIn: data?.expiresIn,
    isLoading,
    error,
    // Helper to check if item can be previewed in browser
    canPreview: data?.mimeType
      ? data.mimeType.startsWith("image/") ||
        data.mimeType.startsWith("video/") ||
        data.mimeType.startsWith("audio/") ||
        data.mimeType === "application/pdf" ||
        data.mimeType.startsWith("text/")
      : false,
  };
}

// Types for upload response
interface UploadResponse {
  success: boolean;
}

// Fetch items from API
async function fetchItems(
  parentId?: string | null,
  includeDeleted = false,
): Promise<ItemsResponse> {
  const params = new URLSearchParams();
  if (parentId) params.append("parentId", parentId);
  if (includeDeleted) params.append("includeDeleted", "true");

  const response = await fetch(`/api/items?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch items");
  }

  return response.json();
}

// Update item
async function updateItem(
  id: string,
  data: UpdateItemRequest,
): Promise<{ item: FileItem; message: string }> {
  const response = await fetch(`/api/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update item");
  }

  return response.json();
}

// Constants for chunked uploads
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks (S3 minimum for multipart)
const SMALL_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB - files smaller than this use single chunk
// Note: All files now use chunked uploads regardless of size for consistency

// Upload a single file using chunked upload
async function uploadFileInChunks(
  file: File,
  parentId?: string,
  onProgress?: (progress: UploadProgress[]) => void,
): Promise<UploadResponse> {
  const fileName = file.name;
  const fileSize = file.size;

  // Extract relative path for folder structure (same as SSE system)
  const relativePath =
    (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
    file.name;

  // Optimize chunk size for small files - use single chunk if file is smaller than 5MB
  // This makes small files upload as efficiently as the old SSE method (1 request)
  // while maintaining the unified chunked architecture for all files
  const effectiveChunkSize =
    fileSize <= SMALL_FILE_THRESHOLD ? fileSize : CHUNK_SIZE;
  const totalChunks = Math.ceil(fileSize / effectiveChunkSize);

  // Initialize progress
  const initialProgress: UploadProgress[] = [
    {
      fileName,
      progress: 0,
      size: formatFileSize(fileSize),
      status: "uploading" as const,
      isFolder: false,
    },
  ];

  onProgress?.(initialProgress);

  try {
    // Step 1: Initialize chunked upload (server will handle folder hierarchy)
    const initResponse = await fetch("/api/items/chunked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName,
        relativePath, // Send relative path to server for folder creation
        fileSize,
        parentId,
      }),
    });

    if (!initResponse.ok) {
      const error = await initResponse.json();
      throw new Error(error.error || "Failed to initialize chunked upload");
    }

    const { uploadId, s3Key } = await initResponse.json();

    // Step 2: Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * effectiveChunkSize;
      const end = Math.min(start + effectiveChunkSize, fileSize);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("uploadId", uploadId);
      formData.append("s3Key", s3Key);
      formData.append("chunkIndex", chunkIndex.toString());
      formData.append("totalChunks", totalChunks.toString());
      formData.append("chunk", chunk);

      const chunkResponse = await fetch("/api/items/chunked/upload", {
        method: "POST",
        body: formData,
      });

      if (!chunkResponse.ok) {
        const error = await chunkResponse.json();
        throw new Error(
          error.error || `Failed to upload chunk ${chunkIndex + 1}`,
        );
      }

      const chunkResult = await chunkResponse.json();

      // Update progress
      const progress = chunkResult.progress;
      const updatedProgress: UploadProgress[] = [
        {
          fileName,
          progress,
          size: formatFileSize(fileSize),
          status: progress >= 100 ? "processing" : "uploading",
          isFolder: false,
        },
      ];

      onProgress?.(updatedProgress);
    }

    // Step 3: Complete upload
    const completeResponse = await fetch("/api/items/chunked/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadId,
        s3Key,
        fileName,
        fileSize,
        totalChunks,
        parentId,
        mimeType: file.type || "application/octet-stream",
      }),
    });

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      throw new Error(error.error || "Failed to complete chunked upload");
    }

    // Final progress update
    const completedProgress: UploadProgress[] = [
      {
        fileName,
        progress: 100,
        size: formatFileSize(fileSize),
        status: "completed" as const,
        isFolder: false,
      },
    ];

    onProgress?.(completedProgress);

    return { success: true };
  } catch (error) {
    // Error progress update
    const errorProgress: UploadProgress[] = [
      {
        fileName,
        progress: 0,
        size: formatFileSize(fileSize),
        status: "error" as const,
        error: error instanceof Error ? error.message : "Upload failed",
        isFolder: false,
      },
    ];

    onProgress?.(errorProgress);
    throw error;
  }
}

// Upload files with unified chunked progress tracking (all files use chunking)
async function uploadFilesWithProgress(
  files: File[],
  parentId?: string,
  onProgress?: (progress: UploadProgress[]) => void,
): Promise<UploadResponse> {
  if (files.length === 0) {
    return { success: true };
  }

  // Detect if this is a folder upload
  const folderName = detectFolderUpload(files);
  const isFromFolder = folderName !== null;

  // Calculate total size for accurate progress tracking
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  // Track progress for all files (for stacked individual file progress)
  const fileProgressMap = new Map<
    number,
    {
      progress: number;
      status: "uploading" | "processing" | "completed" | "error";
    }
  >();

  // Initialize all files with 0% progress
  files.forEach((_, index) => {
    fileProgressMap.set(index, { progress: 0, status: "uploading" });
  });

  // Progress update function that handles all three cases
  const updateProgress = (
    currentFileIndex: number,
    currentFileProgress: number,
    currentFileName: string,
    status: "uploading" | "processing" | "completed" | "error" = "uploading",
  ) => {
    // Update current file progress in the map
    fileProgressMap.set(currentFileIndex, {
      progress: currentFileProgress,
      status,
    });

    if (isFromFolder) {
      // Case 1: Folder uploads - show single folder progress bar
      const completedFiles = files.slice(0, currentFileIndex);
      const completedSize = completedFiles.reduce(
        (sum, file) => sum + file.size,
        0,
      );
      const currentFile = files[currentFileIndex];
      const currentFileCompletedSize = currentFile
        ? (currentFile.size * currentFileProgress) / 100
        : 0;
      const totalCompletedSize = completedSize + currentFileCompletedSize;
      const overallProgress =
        totalSize > 0
          ? Math.min(100, (totalCompletedSize / totalSize) * 100)
          : 0;

      const progressUpdate: UploadProgress[] = [
        {
          fileName: `📁 ${folderName}`,
          progress: overallProgress,
          size: `${Math.min(currentFileIndex + 1, files.length)} of ${files.length} files`,
          status,
          isFolder: true,
          fileCount: {
            total: files.length,
            processed: currentFileIndex + (currentFileProgress >= 100 ? 1 : 0),
          },
        },
      ];

      onProgress?.(progressUpdate);
    } else {
      // Case 2: Multiple individual files - show stacked progress for each file
      const progressUpdate: UploadProgress[] = files.map((file, index) => {
        const fileProgress = fileProgressMap.get(index) || {
          progress: 0,
          status: "uploading" as const,
        };
        return {
          fileName: file.name,
          progress: fileProgress.progress,
          size: formatFileSize(file.size),
          status: fileProgress.status,
          isFolder: false,
        };
      });

      onProgress?.(progressUpdate);
    }
  };

  if (isFromFolder) {
    // For folder uploads: Sequential upload to maintain folder integrity
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];

      try {
        await uploadFileInChunks(file, parentId, (fileProgress) => {
          // Update progress for current file
          const currentFileProgressValue = fileProgress[0]?.progress || 0;
          const currentStatus = fileProgress[0]?.status || "uploading";
          updateProgress(
            fileIndex,
            currentFileProgressValue,
            file.name,
            currentStatus,
          );
        });
      } catch (error) {
        // Handle individual file upload errors
        updateProgress(fileIndex, 0, file.name, "error");
        throw error;
      }
    }
  } else {
    // For multiple individual files: Parallel upload for better performance
    const uploadPromises = files.map((file, fileIndex) => {
      return uploadFileInChunks(file, parentId, (fileProgress) => {
        // Update progress for current file
        const currentFileProgressValue = fileProgress[0]?.progress || 0;
        const currentStatus = fileProgress[0]?.status || "uploading";
        updateProgress(
          fileIndex,
          currentFileProgressValue,
          file.name,
          currentStatus,
        );
      }).catch((error) => {
        // Handle individual file upload errors
        updateProgress(fileIndex, 0, file.name, "error");
        throw error;
      });
    });

    // Wait for all uploads to complete in parallel
    await Promise.all(uploadPromises);
  }

  // Final completion update
  if (isFromFolder) {
    // For folders, update the overall status
    const lastFileIndex = files.length - 1;
    updateProgress(lastFileIndex, 100, "", "completed");
  }

  return { success: true };
}

// Helper function to detect folder uploads and extract folder name
function detectFolderUpload(files: File[]): string | null {
  const filesWithPaths = files.filter((file) => {
    const relativePath = (file as File & { webkitRelativePath?: string })
      .webkitRelativePath;
    return relativePath && relativePath.includes("/");
  });

  if (filesWithPaths.length === 0) return null;

  // Extract root folder name from the first file's path
  const firstPath = (
    filesWithPaths[0] as File & { webkitRelativePath?: string }
  ).webkitRelativePath;
  if (!firstPath) return null;

  const rootFolder = firstPath.split("/")[0];
  return rootFolder;
}

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Create folder
async function createFolder(
  name: string,
  parentId?: string,
): Promise<{ item: ItemResponse["item"]; message: string }> {
  const response = await fetch("/api/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      type: "folder",
      parentId: parentId || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create folder");
  }

  return response.json();
}

// Query hook for fetching items
export function useItems(parentId?: string | null, includeDeleted = false) {
  return useQuery<ItemsResponse, Error>({
    queryKey: ["items", parentId, includeDeleted],
    queryFn: () => fetchItems(parentId, includeDeleted),
  });
}

// Hook for file upload with progress
export function useItemUpload() {
  const queryClient = useQueryClient();

  return useMutation<
    UploadResponse,
    UploadError,
    {
      files: File[];
      parentId?: string;
      onProgress?: (progress: UploadProgress[]) => void;
    }
  >({
    mutationFn: ({ files, parentId, onProgress }) =>
      uploadFilesWithProgress(files, parentId, onProgress),
    onSuccess: () => {
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["folderChildren"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["user", "storage"] });
    },
    onError: (error) => {
      console.error("Upload failed:", error);
    },
  });
}

// Hook for updating items
export function useItemUpdate() {
  const queryClient = useQueryClient();

  return useMutation<
    { item: FileItem; message: string },
    Error,
    {
      id: string;
      data: UpdateItemRequest;
    }
  >({
    mutationFn: ({ id, data }) => updateItem(id, data),
    onSuccess: (response, variables) => {
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["folderChildren"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });

      // Invalidate specific item data
      queryClient.invalidateQueries({
        queryKey: ["itemPreview", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["itemMetadata", variables.id],
      });
    },
    onError: (error) => {
      console.error("Update failed:", error);
    },
  });
}

// Hook for folder creation
export function useItemCreate() {
  const queryClient = useQueryClient();

  return useMutation<
    { item: ItemResponse["item"]; message: string },
    Error,
    {
      name: string;
      parentId?: string;
    }
  >({
    mutationFn: ({ name, parentId }) => createFolder(name, parentId),
    onSuccess: () => {
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["folderChildren"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
    onError: (error) => {
      console.error("Create folder failed:", error);
    },
  });
}

// Unified hook for all item operations
export function useItemOperations() {
  const downloadMutation = useItemDownload();
  const deleteMutation = useItemDelete();
  const uploadMutation = useItemUpload();
  const createMutation = useItemCreate();
  const updateMutation = useItemUpdate();

  return {
    // Query functions (for data fetching) - use the hook directly
    // Note: Use the useItems hook directly in components, not through this function

    // Upload files with progress tracking
    uploadFiles: (
      files: File[],
      parentId?: string,
      onProgress?: (progress: UploadProgress[]) => void,
    ) => {
      return uploadMutation.mutateAsync({ files, parentId, onProgress });
    },

    // Create folder
    createFolder: (name: string, parentId?: string) => {
      return createMutation.mutateAsync({ name, parentId });
    },

    // Update item (rename, move)
    updateItem: (id: string, data: UpdateItemRequest) => {
      return updateMutation.mutateAsync({ id, data });
    },

    // Download item
    download: (itemId: string, fileName: string) => {
      return downloadMutation.mutateAsync({
        itemId,
        fileName,
        options: { download: true },
      });
    },

    // Preview item (get URL and open in new tab)
    preview: async (itemId: string) => {
      try {
        const previewData = await getItemPreviewUrl(itemId);
        // Open the presigned URL in a new tab for preview
        window.open(previewData.url, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.error("Preview failed:", error);
        throw error; // Re-throw so UI can handle the error
      }
    },

    // Delete item permanently (remove from database and S3)
    delete: (itemId: string) => {
      return deleteMutation.mutateAsync({
        itemId,
      });
    },

    // Loading states
    isDownloading: downloadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUploading: uploadMutation.isPending,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,

    // Error states
    downloadError: downloadMutation.error,
    deleteError: deleteMutation.error,
    uploadError: uploadMutation.error,
    createError: createMutation.error,
    updateError: updateMutation.error,

    // Direct access to mutations for advanced usage
    mutations: {
      upload: uploadMutation,
      create: createMutation,
      update: updateMutation,
      download: downloadMutation,
      delete: deleteMutation,
    },
  };
}

// Convenience hook that combines operations with data fetching
export function useItemsWithOperations(
  parentId?: string | null,
  includeDeleted = false,
) {
  const itemsQuery = useItems(parentId, includeDeleted);
  const operations = useItemOperations();

  return {
    // Data
    ...itemsQuery,

    // Operations
    ...operations,
  };
}
