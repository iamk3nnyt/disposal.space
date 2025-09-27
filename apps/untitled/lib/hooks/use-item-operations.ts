"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

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

// Delete item (with S3 cleanup for files)
async function deleteItem(
  itemId: string,
  permanent = false,
): Promise<ItemDeleteResponse> {
  const params = new URLSearchParams();
  if (permanent) params.append("permanent", "true");

  const response = await fetch(`/api/items/${itemId}?${params.toString()}`, {
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
        toast.success(`Downloaded "${variables.fileName}"`);
      } else if (variables.options?.preview) {
        toast.success(`Preview ready for "${variables.fileName}"`);
      }
    },
    onError: (error, variables) => {
      console.error("Download failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Download failed";
      toast.error(
        `Failed to download "${variables.fileName}": ${errorMessage}`,
      );
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
      permanent?: boolean;
    }
  >({
    mutationFn: ({ itemId, permanent }) => deleteItem(itemId, permanent),
    onSuccess: (data, variables) => {
      // Invalidate items queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["userStorage"] });

      // Show success message (this will be overridden by specific folder/file messages)
      const action = variables.permanent
        ? "permanently deleted"
        : "moved to trash";
      toast.success(`Item ${action} successfully`);
    },
    onError: (error) => {
      console.error("Delete failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Delete failed";
      toast.error(errorMessage);
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
interface UploadFileResult {
  file: ItemResponse["item"];
  s3Key: string;
  s3Url: string;
  category: string;
  size: number;
  mimeType: string;
}

interface UploadResponse {
  message: string;
  files: UploadFileResult[];
  totalSize: number;
  newStorageUsed: number;
  storageLimit: number;
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

// Upload files with progress tracking
async function uploadFilesWithProgress(
  files: File[],
  parentId?: string,
  onProgress?: (progress: UploadProgress[]) => void,
): Promise<UploadResponse> {
  const formData = new FormData();

  // Add files to form data
  files.forEach((file) => {
    formData.append("files", file);
  });

  if (parentId) {
    formData.append("parentId", parentId);
  }

  // Initialize progress tracking
  const initialProgress: UploadProgress[] = files.map((file) => ({
    fileName: file.name,
    progress: 0,
    size: formatFileSize(file.size),
    status: "uploading" as const,
  }));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;

        const updatedProgress = initialProgress.map((item) => ({
          ...item,
          progress: Math.min(percentComplete, 90), // Reserve 90-100% for processing
          status:
            percentComplete < 90
              ? ("uploading" as const)
              : ("processing" as const),
        }));

        onProgress?.(updatedProgress);
      }
    });

    // Handle response
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);

          // Mark as completed
          const completedProgress = initialProgress.map((item) => ({
            ...item,
            progress: 100,
            status: "completed" as const,
          }));

          onProgress?.(completedProgress);
          resolve(response);
        } catch {
          reject(new Error("Failed to parse response"));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);

          // Mark as error
          const errorProgress = initialProgress.map((item) => ({
            ...item,
            status: "error" as const,
            error: errorResponse.error || "Upload failed",
          }));

          onProgress?.(errorProgress);
          reject(errorResponse);
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle network errors
    xhr.addEventListener("error", () => {
      const errorProgress = initialProgress.map((item) => ({
        ...item,
        status: "error" as const,
        error: "Network error",
      }));

      onProgress?.(errorProgress);
      reject(new Error("Network error during upload"));
    });

    // Send request
    xhr.open("POST", "/api/items");
    xhr.send(formData);
  });
}

// Note: uploadFiles function removed - use uploadFilesWithProgress directly

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
    onSuccess: (data, variables) => {
      // Invalidate items queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["userStorage"] });

      // Invalidate specific parent folder if provided
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: ["items", variables.parentId],
        });
      }
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
      // Invalidate items queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });

      // Show success message
      if (variables.data.name) {
        toast.success(`Item renamed to "${variables.data.name}"`);
      } else {
        toast.success("Item updated successfully");
      }
    },
    onError: (error) => {
      console.error("Update failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Update failed";
      toast.error(errorMessage);
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
    onSuccess: (response, variables) => {
      // Invalidate items queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });

      // Show success message
      toast.success(`Folder "${variables.name}" created successfully`);
    },
    onError: (error, variables) => {
      console.error("Create folder failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create folder";
      toast.error(
        `Failed to create folder "${variables.name}": ${errorMessage}`,
      );
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
      downloadMutation.mutate({
        itemId,
        fileName,
        options: { download: true },
      });
    },

    // Preview item (get URL and open in new tab)
    preview: async (itemId: string, fileName: string) => {
      try {
        const previewData = await getItemPreviewUrl(itemId);
        // Open the presigned URL in a new tab for preview
        window.open(previewData.url, "_blank", "noopener,noreferrer");
        toast.success(`Preview opened for "${fileName}"`);
      } catch (error) {
        console.error("Preview failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Preview failed";
        toast.error(`Failed to preview "${fileName}": ${errorMessage}`);
      }
    },

    // Delete item (soft delete)
    delete: (itemId: string) => {
      return deleteMutation.mutateAsync({
        itemId,
        permanent: false,
      });
    },

    // Permanently delete item (with S3 cleanup)
    permanentDelete: (itemId: string) => {
      return deleteMutation.mutateAsync({
        itemId,
        permanent: true,
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
