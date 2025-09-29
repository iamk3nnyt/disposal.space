import { UserStorage, UserStorageResponse } from "@/lib/types";
import { ApiService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

// Query keys
export const userStorageKeys = {
  all: ["userStorage"] as const,
  storage: () => [...userStorageKeys.all, "storage"] as const,
};

// Transform API response to expected format
function transformStorageResponse(response: UserStorageResponse): UserStorage {
  return {
    storageUsed: response.user.storageUsed,
    storageLimit: response.user.storageLimit,
    storageUsedFormatted: response.user.storageUsedFormatted,
    storageLimitFormatted: response.user.storageLimitFormatted,
    usagePercentage: response.user.storageUsedPercentage,
    itemCount: response.stats.totalItems,
    folderCount: response.stats.folderCount,
    fileCount: response.stats.fileCount,
  };
}

// Hook to fetch user storage information
export function useUserStorage() {
  return useQuery({
    queryKey: userStorageKeys.storage(),
    queryFn: async () => {
      const response = await ApiService.getUserStorage();
      return transformStorageResponse(response);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - storage info changes frequently
    refetchOnWindowFocus: true, // Refetch when app comes back to foreground
  });
}
