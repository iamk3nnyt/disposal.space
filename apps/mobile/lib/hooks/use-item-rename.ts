import { FileItem } from "@/lib/types";
import { ApiService } from "@/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

interface RenameItemRequest {
  itemId: string;
  newName: string;
  currentName: string;
}

interface RenameItemResponse {
  item: FileItem;
  message: string;
}

// Validation function for item names
function validateItemName(name: string): { isValid: boolean; error?: string } {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { isValid: false, error: "Name cannot be empty" };
  }

  if (trimmedName.length > 255) {
    return { isValid: false, error: "Name cannot exceed 255 characters" };
  }

  // Check for invalid characters (common across file systems)
  // const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  // if (invalidChars.test(trimmedName)) {
  //   return { isValid: false, error: "Name contains invalid characters" };
  // }

  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  if (reservedNames.test(trimmedName)) {
    return { isValid: false, error: "Name is reserved and cannot be used" };
  }

  // Check for names that end with a dot or space
  if (trimmedName.endsWith(".") || trimmedName.endsWith(" ")) {
    return { isValid: false, error: "Name cannot end with a dot or space" };
  }

  return { isValid: true };
}

export function useItemRename() {
  const queryClient = useQueryClient();

  return useMutation<RenameItemResponse, Error, RenameItemRequest>({
    mutationFn: async ({ itemId, newName, currentName }) => {
      // Validate the new name
      const validation = validateItemName(newName);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check if the name actually changed
      if (newName.trim() === currentName.trim()) {
        throw new Error("New name must be different from current name");
      }

      // Call the API to update the item
      const response = await ApiService.updateItem(itemId, {
        name: newName.trim(),
      });
      return response as RenameItemResponse;
    },
    onSuccess: (response, variables) => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["userStorage"] });

      // Show success message
      Alert.alert(
        "Rename Successful",
        `"${variables.currentName}" has been renamed to "${response.item.name}"`
      );
    },
    onError: (error: Error, variables) => {
      console.error("Rename failed:", error);

      // Show error message
      Alert.alert(
        "Rename Failed",
        error.message || `Failed to rename "${variables.currentName}"`
      );
    },
  });
}

// Hook for batch renaming (if needed in the future)
export function useItemBatchRename() {
  const queryClient = useQueryClient();

  return useMutation<RenameItemResponse[], Error, RenameItemRequest[]>({
    mutationFn: async (renameRequests) => {
      const results: RenameItemResponse[] = [];

      for (const request of renameRequests) {
        // Validate each name
        const validation = validateItemName(request.newName);
        if (!validation.isValid) {
          throw new Error(
            `Invalid name for "${request.currentName}": ${validation.error}`
          );
        }

        // Check if the name actually changed
        if (request.newName.trim() === request.currentName.trim()) {
          continue; // Skip items with no name change
        }

        try {
          const response = await ApiService.updateItem(request.itemId, {
            name: request.newName.trim(),
          });
          results.push(response as RenameItemResponse);
        } catch (error) {
          throw new Error(
            `Failed to rename "${request.currentName}": ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      return results;
    },
    onSuccess: (responses) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["userStorage"] });

      // Show success message
      Alert.alert(
        "Batch Rename Successful",
        `Successfully renamed ${responses.length} item(s)`
      );
    },
    onError: (error: Error) => {
      console.error("Batch rename failed:", error);
      Alert.alert("Batch Rename Failed", error.message);
    },
  });
}

// Export validation function for use in components
export { validateItemName };
