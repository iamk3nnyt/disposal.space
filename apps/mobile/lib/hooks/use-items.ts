import { ApiService } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
export const itemsKeys = {
  all: ["items"] as const,
  lists: () => [...itemsKeys.all, "list"] as const,
  list: (parentId?: string | null) =>
    [...itemsKeys.lists(), { parentId }] as const,
  search: (query: string) => [...itemsKeys.all, "search", query] as const,
};

// Hook to fetch items (files and folders)
export function useItems(parentId?: string | null) {
  return useQuery({
    queryKey: itemsKeys.list(parentId),
    queryFn: () => ApiService.getItems(parentId),
    enabled: true, // Always enabled, parentId can be null for root
  });
}

// Hook to search items
export function useSearchItems(query: string) {
  return useQuery({
    queryKey: itemsKeys.search(query),
    queryFn: () => ApiService.searchItems(query),
    enabled: query.length > 0, // Only search when there's a query
  });
}

// Hook for item operations (create, update, delete)
export function useItemOperations() {
  const queryClient = useQueryClient();

  const createFolder = useMutation({
    mutationFn: ({
      name,
      parentId,
    }: {
      name: string;
      parentId?: string | null;
    }) => ApiService.createFolder(name, parentId),
    onSuccess: (_, variables) => {
      // Invalidate the items list for the parent folder
      queryClient.invalidateQueries({
        queryKey: itemsKeys.list(variables.parentId),
      });
      // Also invalidate the general items queries
      queryClient.invalidateQueries({
        queryKey: itemsKeys.lists(),
      });
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string } }) =>
      ApiService.updateItem(id, data),
    onSuccess: () => {
      // Invalidate all items queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: itemsKeys.all,
      });
    },
  });

  const deleteItem = useMutation({
    mutationFn: ({
      id,
      permanent = true,
    }: {
      id: string;
      permanent?: boolean;
    }) => ApiService.deleteItem(id, permanent),
    onSuccess: () => {
      // Invalidate all items queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: itemsKeys.all,
      });
    },
  });

  const uploadFiles = useMutation({
    mutationFn: ({
      files,
      onProgress,
    }: {
      files: FormData;
      onProgress?: (progress: any) => void;
    }) => ApiService.uploadFiles(files, onProgress),
    onSuccess: () => {
      // Invalidate all items queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: itemsKeys.all,
      });
    },
  });

  return {
    createFolder,
    updateItem,
    deleteItem,
    uploadFiles,
  };
}
