import { ApiService } from "@/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

interface DeleteItemRequest {
  itemId: string;
  itemName: string;
  isFolder: boolean;
}

interface DeleteItemResponse {
  message: string;
  sizeFreed: number;
  itemsDeleted: number;
}

export function useItemDelete() {
  const queryClient = useQueryClient();

  return useMutation<DeleteItemResponse, Error, DeleteItemRequest>({
    mutationFn: async ({ itemId }) => {
      // Call the API to delete the item (permanent deletion)
      const response = await ApiService.deleteItem(itemId, true);
      return response as DeleteItemResponse;
    },
    onSuccess: (response, variables) => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["userStorage"] });

      // Remove specific item data since it's deleted
      queryClient.removeQueries({
        queryKey: ["itemPreview", variables.itemId],
      });
      queryClient.removeQueries({
        queryKey: ["itemMetadata", variables.itemId],
      });

      // Show success message with details
      const itemType = variables.isFolder ? "folder" : "file";
      const deletedMessage = variables.isFolder
        ? `"${variables.itemName}" and all its contents have been permanently deleted.`
        : `"${variables.itemName}" has been permanently deleted.`;

      Alert.alert("Delete Successful", deletedMessage, [
        { text: "OK", style: "default" },
      ]);
    },
    onError: (error: Error, variables) => {
      console.error("Delete failed:", error);

      // Show error message
      Alert.alert(
        "Delete Failed",
        error.message ||
          `Failed to delete "${variables.itemName}". Please try again.`,
        [{ text: "OK", style: "default" }]
      );
    },
  });
}

// Hook for batch deletion (if needed in the future)
export function useItemBatchDelete() {
  const queryClient = useQueryClient();

  return useMutation<DeleteItemResponse[], Error, DeleteItemRequest[]>({
    mutationFn: async (deleteRequests) => {
      const results: DeleteItemResponse[] = [];

      for (const request of deleteRequests) {
        try {
          const response = await ApiService.deleteItem(request.itemId, true);
          results.push(response as DeleteItemResponse);
        } catch (error) {
          throw new Error(
            `Failed to delete "${request.itemName}": ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      return results;
    },
    onSuccess: (responses, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["userStorage"] });

      // Remove specific item data for all deleted items
      variables.forEach((variable) => {
        queryClient.removeQueries({
          queryKey: ["itemPreview", variable.itemId],
        });
        queryClient.removeQueries({
          queryKey: ["itemMetadata", variable.itemId],
        });
      });

      // Show success message
      const totalItems = responses.reduce(
        (sum, response) => sum + response.itemsDeleted,
        0
      );
      Alert.alert(
        "Batch Delete Successful",
        `Successfully deleted ${totalItems} item(s)`,
        [{ text: "OK", style: "default" }]
      );
    },
    onError: (error: Error) => {
      console.error("Batch delete failed:", error);
      Alert.alert("Batch Delete Failed", error.message, [
        { text: "OK", style: "default" },
      ]);
    },
  });
}

// Utility function to show confirmation dialog
export function showDeleteConfirmation(
  itemName: string,
  isFolder: boolean,
  onConfirm: () => void,
  onCancel?: () => void
) {
  const itemType = isFolder ? "folder" : "file";
  const warningMessage = isFolder
    ? `Are you sure you want to permanently delete "${itemName}" and all its contents?\n\nThis action cannot be undone.`
    : `Are you sure you want to permanently delete "${itemName}"?\n\nThis action cannot be undone.`;

  Alert.alert(
    `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
    warningMessage,
    [
      {
        text: "Cancel",
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
}
