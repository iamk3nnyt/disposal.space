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
    onError: (error, variables) => {
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

// Upload files with unified SSE progress tracking
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

  try {
    // Use unified streaming endpoint
    const response = await fetch("/api/items?stream=true", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response stream available");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalResult: UploadResponse | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const eventData = JSON.parse(line.slice(6));

            if (eventData.category === "upload") {
              if (eventData.type === "progress") {
                // Update progress based on server-side events
                const updatedProgress = initialProgress.map((item) => ({
                  ...item,
                  progress: eventData.data.progress || 0,
                  status:
                    eventData.data.phase === "completed"
                      ? ("completed" as const)
                      : eventData.data.phase === "uploading"
                        ? ("uploading" as const)
                        : ("processing" as const),
                }));

                onProgress?.(updatedProgress);
              } else if (eventData.type === "completed") {
                // Mark all as completed
                const completedProgress = initialProgress.map((item) => ({
                  ...item,
                  progress: 100,
                  status: "completed" as const,
                }));

                onProgress?.(completedProgress);

                // Create final result from event data
                finalResult = {
                  files: [], // Will be populated from actual response
                  totalSize: eventData.data.totalSize || 0,
                  message: eventData.data.message || "Upload completed",
                  newStorageUsed: 0, // Will be calculated
                  storageLimit: 0, // Will be populated
                };
              } else if (eventData.type === "error") {
                // Mark as error
                const errorProgress = initialProgress.map((item) => ({
                  ...item,
                  status: "error" as const,
                  error: eventData.data.message || "Upload failed",
                }));

                onProgress?.(errorProgress);
                throw new Error(eventData.data.message || "Upload failed");
              }
            }
          } catch (parseError) {
            console.error("Failed to parse SSE event:", parseError);
          }
        }
      }
    }

    // Return the final result or a default response
    return (
      finalResult || {
        files: [],
        totalSize: 0,
        message: "Upload completed",
        newStorageUsed: 0,
        storageLimit: 0,
      }
    );
  } catch (error) {
    // Mark as error
    const errorProgress = initialProgress.map((item) => ({
      ...item,
      status: "error" as const,
      error: error instanceof Error ? error.message : "Upload failed",
    }));

    onProgress?.(errorProgress);
    throw error;
  }
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
    onSuccess: (response, variables) => {
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["folderChildren"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
    onError: (error, variables) => {
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
    preview: async (itemId: string, fileName: string) => {
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
