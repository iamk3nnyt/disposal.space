import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useItems } from "@/lib/hooks/use-items";
import { FileItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FileListProps {
  parentId?: string | null;
  onItemPress?: (item: FileItem) => void;
  onRefresh?: () => void;
}

function getFileIcon(type: string, filename?: string): string {
  const extension = filename ? filename.split(".").pop()?.toLowerCase() : "";

  switch (type.toLowerCase()) {
    case "folder":
      return "📁";
    case "image":
      if (extension === "svg") return "📐";
      if (extension === "gif") return "🎞️";
      return "🖼️";
    case "video":
      return "🎬";
    case "audio":
      return "🎵";
    case "document":
      if (extension === "pdf") return "📄";
      if (extension === "docx" || extension === "doc") return "📝";
      return "📄";
    case "spreadsheet":
      if (extension === "csv") return "📊";
      return "📈";
    case "presentation":
      return "📊";
    case "archive":
      return "🗜️";
    case "code":
      if (extension === "js" || extension === "jsx") return "🟨";
      if (extension === "ts" || extension === "tsx") return "🟦";
      if (extension === "py") return "🐍";
      if (extension === "java") return "☕";
      return "💻";
    case "text":
      return "📝";
    default:
      return "📄";
  }
}

export function FileList({ parentId, onItemPress, onRefresh }: FileListProps) {
  const { data, isLoading, error, refetch } = useItems(parentId);

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  const renderItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemIcon}>
            {getFileIcon(item.type, item.name)}
          </Text>
          <View style={styles.itemInfo}>
            <ThemedText style={styles.itemName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText style={styles.itemDetails}>
              {item.isFolder
                ? formatDate(item.lastModified)
                : `${item.type.toUpperCase()} • ${item.size} • ${formatDate(item.lastModified)}`}
            </ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <ThemedView style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📁</Text>
      <ThemedText style={styles.emptyTitle}>
        {parentId ? "This folder is empty" : "Your disposal space is empty"}
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {parentId
          ? "Upload files to this folder or create subfolders to organize your content."
          : "Start by uploading files or folders to organize your digital assets."}
      </ThemedText>
    </ThemedView>
  );

  const renderError = () => (
    <ThemedView style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <ThemedText style={styles.errorTitle}>Failed to load items</ThemedText>
      <ThemedText style={styles.errorSubtitle}>
        {error instanceof Error ? error.message : "Something went wrong"}
      </ThemedText>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <ThemedText style={styles.retryText}>Try Again</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <ThemedText style={styles.loadingText}>
          Loading your disposal space...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return renderError();
  }

  const items = data?.items || [];

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          colors={["#16a34a"]}
          tintColor="#16a34a"
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  itemContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    padding: 16,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
