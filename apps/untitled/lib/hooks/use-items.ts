"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Types
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

export interface CreateItemRequest {
  name: string;
  type: "file" | "folder";
  parentId?: string;
  fileType?: string;
  sizeBytes?: number;
  mimeType?: string;
}

export interface UpdateItemRequest {
  name?: string;
  parentId?: string;
}

// API functions
async function fetchItems(parentId?: string): Promise<ItemsResponse> {
  const params = new URLSearchParams();
  if (parentId) {
    params.append("parentId", parentId);
  }

  const response = await fetch(`/api/items?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.statusText}`);
  }

  return response.json();
}

async function createItem(
  data: CreateItemRequest,
): Promise<{ item: FileItem; message: string }> {
  const response = await fetch("/api/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create item");
  }

  return response.json();
}

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

async function deleteItem(
  id: string,
  permanent = false,
): Promise<{ message: string; sizeFreed: number }> {
  const params = new URLSearchParams();
  if (permanent) {
    params.append("permanent", "true");
  }

  const response = await fetch(`/api/items/${id}?${params.toString()}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete item");
  }

  return response.json();
}

// React Query hooks
export function useItems(parentId?: string) {
  return useQuery({
    queryKey: ["items", parentId],
    queryFn: () => fetchItems(parentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItem,
    onSuccess: (data, variables) => {
      // Invalidate and refetch items for the parent folder
      queryClient.invalidateQueries({
        queryKey: ["items", variables.parentId],
      });
      // Also invalidate root items if no parent
      if (!variables.parentId) {
        queryClient.invalidateQueries({ queryKey: ["items", undefined] });
      }
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemRequest }) =>
      updateItem(id, data),
    onSuccess: () => {
      // Invalidate all items queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent?: boolean }) =>
      deleteItem(id, permanent),
    onSuccess: () => {
      // Invalidate all items queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
