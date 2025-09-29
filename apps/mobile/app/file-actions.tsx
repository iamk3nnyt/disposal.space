import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { FileItem } from "@/lib/types";

export default function FileActionsScreen() {
  const params = useLocalSearchParams();
  const fileData = params.fileData as string;

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

  const handleDownload = () => {
    Alert.alert("Download", `Downloading ${selectedItem.name}...`);
    // TODO: Implement actual download functionality
    router.back();
  };

  const handleRename = () => {
    Alert.prompt(
      "Rename File",
      "Enter new name:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rename",
          onPress: (newName?: string) => {
            if (newName && newName.trim()) {
              Alert.alert("Rename", `Renamed to ${newName}`);
              // TODO: Implement actual rename functionality
            }
          },
        },
      ],
      "plain-text",
      selectedItem.name
    );
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete File",
      `Are you sure you want to delete "${selectedItem.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Delete", `Deleted ${selectedItem.name}`);
            // TODO: Implement actual delete functionality
            router.back();
          },
        },
      ]
    );
  };

  const handleShare = () => {
    Alert.alert("Share", `Sharing ${selectedItem.name}...`);
    // TODO: Implement actual share functionality
    router.back();
  };

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
            style={styles.actionButton}
            onPress={handleDownload}
          >
            <IconSymbol name="arrow.down" size={20} color="#16a34a" />
            <ThemedText style={styles.actionText}>Download</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <IconSymbol name="square.and.arrow.up" size={20} color="#16a34a" />
            <ThemedText style={styles.actionText}>Share</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleRename}>
            <IconSymbol name="pencil" size={20} color="#16a34a" />
            <ThemedText style={styles.actionText}>Rename</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <IconSymbol name="trash" size={20} color="#dc2626" />
            <ThemedText style={[styles.actionText, styles.deleteText]}>
              Delete
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
  deleteButton: {
    backgroundColor: "#fef2f2",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 12,
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
});
