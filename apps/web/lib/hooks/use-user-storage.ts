"use client";

import { useQuery } from "@tanstack/react-query";

// Types
export interface UserStorageDetails {
  id: string;
  clerkUserId: string;
  email?: string | null;
  name?: string | null;
  storageUsed: number;
  storageLimit: number;
  storageUsedFormatted: string;
  storageLimitFormatted: string;
  storageUsedPercentage: number;
  storageAvailable: number;
  storageAvailableFormatted: string;
}

export interface StorageStats {
  totalItems: number;
  fileCount: number;
  folderCount: number;
  deletedCount: number;
}

export interface UserStorageResponse {
  user: UserStorageDetails;
  stats: StorageStats;
}

// API function
async function fetchUserStorage(): Promise<UserStorageResponse> {
  const response = await fetch("/api/user/storage");

  if (!response.ok) {
    throw new Error(`Failed to fetch user storage: ${response.statusText}`);
  }

  return response.json();
}

// React Query hook
export function useUserStorage() {
  return useQuery({
    queryKey: ["user", "storage"],
    queryFn: fetchUserStorage,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
