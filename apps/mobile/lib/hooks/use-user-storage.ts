import { ApiService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

// Query keys
export const userStorageKeys = {
  all: ["userStorage"] as const,
  storage: () => [...userStorageKeys.all, "storage"] as const,
};

// Hook to fetch user storage information
export function useUserStorage() {
  return useQuery({
    queryKey: userStorageKeys.storage(),
    queryFn: () => ApiService.getUserStorage(),
    staleTime: 1000 * 60 * 2, // 2 minutes - storage info changes frequently
    refetchOnWindowFocus: true, // Refetch when app comes back to foreground
  });
}
