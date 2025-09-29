import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useFileDownload } from "@/lib/hooks/use-file-download";
import {
  showDeleteConfirmation,
  useItemDelete,
} from "@/lib/hooks/use-item-delete";
import { useItemRename } from "@/lib/hooks/use-item-rename";
import { useItemOperations } from "@/lib/hooks/use-items";
import { FileItem } from "@/lib/types";

export default function FileActionsScreen() {
  const params = useLocalSearchParams();
  const fileData = params.fileData as string;
  const downloadMutation = useFileDownload();
  const renameMutation = useItemRename();
  const deleteMutation = useItemDelete();
  const { uploadFiles } = useItemOperations();

  // Rename modal state
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  if (!fileData) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            No File Selected
          </ThemedText>
          <ThemedText style={styles.description}>
            Please select a file to view available actions.
          </ThemedText>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.cancelText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const selectedItem: FileItem = JSON.parse(fileData);

  const handleDownload = async () => {
    if (selectedItem.isFolder) {
      Alert.alert("Cannot Download", "Folders cannot be downloaded directly.");
      return;
    }

    try {
      await downloadMutation.mutateAsync({
        itemId: selectedItem.id,
        fileName: selectedItem.name,
        options: {
          saveToGallery:
            selectedItem.type.toLowerCase().startsWith("image") ||
            selectedItem.type.toLowerCase().startsWith("video"),
        },
      });

      // Close the modal after successful download
      router.back();
    } catch (error) {
      console.error("Download failed:", error);
      // Error is handled by the mutation's onError callback
    }
  };

  const handleRename = () => {
    setRenameValue(selectedItem.name);
    setIsRenameModalVisible(true);
  };

  const handleRenameConfirm = async () => {
    // Simple validation matching untitled app
    if (!renameValue.trim()) {
      Alert.alert("Invalid Name", "Name cannot be empty.");
      return;
    }

    if (renameValue.trim() === selectedItem.name.trim()) {
      Alert.alert("No Change", "The new name is the same as the current name.");
      return;
    }

    try {
      await renameMutation.mutateAsync({
        itemId: selectedItem.id,
        newName: renameValue.trim(),
        currentName: selectedItem.name,
      });

      setIsRenameModalVisible(false);
      router.back();
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error("Rename failed:", error);
    }
  };

  const handleRenameCancel = () => {
    setIsRenameModalVisible(false);
    setRenameValue("");
  };

  const handleUpload = async () => {
    if (!selectedItem.isFolder) {
      Alert.alert("Invalid Action", "You can only upload files to folders.");
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsUploading(true);

        // Create FormData
        const formData = new FormData();

        result.assets.forEach((asset) => {
          formData.append("files", {
            uri: asset.uri,
            type: asset.mimeType || "application/octet-stream",
            name: asset.name,
          } as any);
        });

        // Add parentId to FormData to upload to the selected folder
        formData.append("parentId", selectedItem.id);

        try {
          await uploadFiles.mutateAsync({
            files: formData,
            onProgress: (progress) => {
              console.log("Upload progress:", progress);
            },
          });

          Alert.alert(
            "Upload Successful",
            `${result.assets.length} file(s) uploaded to "${selectedItem.name}" successfully!`,
            [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]
          );
        } catch (error) {
          console.error("Upload error:", error);
          Alert.alert(
            "Upload Failed",
            error instanceof Error ? error.message : "Failed to upload files"
          );
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error("File picker error:", error);
      Alert.alert("Error", "Failed to pick files");
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    showDeleteConfirmation(
      selectedItem.name,
      selectedItem.isFolder,
      async () => {
        try {
          await deleteMutation.mutateAsync({
            itemId: selectedItem.id,
            itemName: selectedItem.name,
            isFolder: selectedItem.isFolder,
          });

          // Close the modal after successful deletion
          router.back();
        } catch (error) {
          // Error is handled by the mutation's onError callback
          console.error("Delete failed:", error);
        }
      }
    );
  };

  // const handleShare = () => {
  //   Alert.alert("Share", `Sharing ${selectedItem.name}...`);
  //   // TODO: Implement actual share functionality
  //   router.back();
  // };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{selectedItem.name}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {selectedItem.type.toUpperCase()} • {selectedItem.size}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              (selectedItem.isFolder || downloadMutation.isPending) &&
                styles.actionButtonDisabled,
            ]}
            onPress={handleDownload}
            disabled={selectedItem.isFolder || downloadMutation.isPending}
          >
            {downloadMutation.isPending ? (
              <ActivityIndicator size={20} color="#16a34a" />
            ) : (
              <IconSymbol
                name="arrow.down"
                size={20}
                color={selectedItem.isFolder ? "#9ca3af" : "#16a34a"}
              />
            )}
            <ThemedText
              style={[
                styles.actionText,
                selectedItem.isFolder && styles.actionTextDisabled,
              ]}
            >
              {downloadMutation.isPending ? "Downloading..." : "Download"}
            </ThemedText>
          </TouchableOpacity>

          {/* Upload button - only show for folders */}
          {selectedItem.isFolder && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                isUploading && styles.actionButtonDisabled,
              ]}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size={20} color="#16a34a" />
              ) : (
                <IconSymbol name="arrow.up.doc" size={20} color="#16a34a" />
              )}
              <ThemedText style={styles.actionText}>
                {isUploading ? "Uploading..." : "Upload Files"}
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <IconSymbol name="square.and.arrow.up" size={20} color="#16a34a" />
            <ThemedText style={styles.actionText}>Share</ThemedText>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[
              styles.actionButton,
              renameMutation.isPending && styles.actionButtonDisabled,
            ]}
            onPress={handleRename}
            disabled={renameMutation.isPending}
          >
            {renameMutation.isPending ? (
              <ActivityIndicator size={20} color="#16a34a" />
            ) : (
              <IconSymbol name="pencil" size={20} color="#16a34a" />
            )}
            <ThemedText style={styles.actionText}>
              {renameMutation.isPending ? "Renaming..." : "Rename"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
              deleteMutation.isPending && styles.actionButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator size={20} color="#dc2626" />
            ) : (
              <IconSymbol name="trash" size={20} color="#dc2626" />
            )}
            <ThemedText style={[styles.actionText, styles.deleteText]}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Rename Modal */}
      <Modal
        visible={isRenameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleRenameCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Rename {selectedItem.isFolder ? "Folder" : "File"}
              </ThemedText>
              <ThemedText style={styles.modalSubtitle}>
                Enter a new name for "{selectedItem.name}"
              </ThemedText>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder="Enter new name"
                autoFocus={true}
                selectTextOnFocus={true}
                maxLength={255}
                returnKeyType="done"
                onSubmitEditing={handleRenameConfirm}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleRenameCancel}
              >
                <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  renameMutation.isPending && styles.modalButtonDisabled,
                ]}
                onPress={handleRenameConfirm}
                disabled={renameMutation.isPending || !renameValue.trim()}
              >
                {renameMutation.isPending ? (
                  <ActivityIndicator size={20} color="#ffffff" />
                ) : (
                  <ThemedText style={styles.modalConfirmText}>
                    Rename
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 40,
  },
  actions: {
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    marginBottom: 12,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 12,
  },
  actionTextDisabled: {
    color: "#9ca3af",
  },
  deleteText: {
    color: "#dc2626",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});
