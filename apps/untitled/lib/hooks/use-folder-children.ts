"use client";

import { useQueries } from "@tanstack/react-query";

// Types
interface FolderChild {
  id: string;
  name: string;
  type: string;
}

interface FolderChildrenResult {
  folderChildren: Record<string, FolderChild[]>;
  isLoading: boolean;
  errors: Record<string, Error>;
}

// API function to fetch folder children
async function fetchFolderChildren(folderId: string): Promise<FolderChild[]> {
  const response = await fetch(`/api/items?parentId=${folderId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch folder children: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items.map((item: { id: string; name: string; type: string }) => ({
    id: item.id,
    name: item.name,
    type: item.type,
  }));
}

// Custom hook to manage multiple folder children queries
export function useFolderChildren(
  expandedFolderIds: string[],
): FolderChildrenResult {
  const queries = useQueries({
    queries: expandedFolderIds.map((folderId) => ({
      queryKey: ["folderChildren", folderId],
      queryFn: () => fetchFolderChildren(folderId),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!folderId, // Only run if folderId exists
    })),
  });

  // Transform results into the expected format
  const folderChildren: Record<string, FolderChild[]> = {};
  const errors: Record<string, Error> = {};
  let isLoading = false;

  expandedFolderIds.forEach((folderId, index) => {
    const query = queries[index];

    if (query.isLoading) {
      isLoading = true;
    }

    if (query.error) {
      errors[folderId] = query.error as Error;
    }

    if (query.data) {
      folderChildren[folderId] = query.data;
    }
  });

  return {
    folderChildren,
    isLoading,
    errors,
  };
}
