import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useItems } from "@/lib/hooks/use-items";
import { FileItem } from "@/lib/types";
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
    case "mp3":
      return "🎵";
    case "document":
    case "pdf":
      return "📄";
    case "docx":
    case "doc":
      return "📝";
    case "spreadsheet":
    case "xls":
    case "xlsx":
      return "📊";
    case "presentation":
    case "pptx":
      return "📊";
    case "archive":
    case "zip":
      return "🗜️";
    case "code":
      if (extension === "js" || extension === "jsx") return "🟨";
      if (extension === "ts" || extension === "tsx") return "🟦";
      if (extension === "py") return "🐍";
      if (extension === "java") return "☕";
      return "💾";
    case "text":
    case "txt":
      return "📝";
    case "dmg":
      return "💿";
    case "page":
      return "📄";
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
            <View style={styles.itemMeta}>
              {!item.isFolder && item.type && (
                <View style={styles.typeTag}>
                  <ThemedText style={styles.typeText}>
                    {item.type.toUpperCase()}
                  </ThemedText>
                </View>
              )}
              <ThemedText style={styles.itemDetails}>
                {item.isFolder ? "" : item.size}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.itemRight}>
          <ThemedText style={styles.dateText}>{item.lastModified}</ThemedText>
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
    backgroundColor: "#ffffff",
  },
  emptyList: {
    flex: 1,
  },
  itemContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    fontSize: 28,
    marginRight: 12,
    width: 32,
    textAlign: "center",
    lineHeight: 32,
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeTag: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  itemDetails: {
    fontSize: 14,
    color: "#6b7280",
  },
  itemRight: {
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#ffffff",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    color: "#111827",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#ffffff",
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    color: "#111827",
  },
  errorSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
