import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useUserStorage } from "@/lib/hooks/use-user-storage";
import { UserStorage } from "@/lib/types";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export function StorageInfo() {
  const { data: storage, isLoading, error } = useUserStorage();

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="small" color="#16a34a" />
        <ThemedText style={styles.loadingText}>Loading storage...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !storage) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>
          Storage info unavailable
        </ThemedText>
      </ThemedView>
    );
  }

  const typedStorage = storage as UserStorage;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Storage Used</ThemedText>
        <ThemedText style={styles.usage}>
          {typedStorage.storageUsedFormatted} of{" "}
          {typedStorage.storageLimitFormatted}
        </ThemedText>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(typedStorage.usagePercentage, 100)}%` },
            ]}
          />
        </View>
        <ThemedText style={styles.percentage}>
          {Math.round(typedStorage.usagePercentage)}%
        </ThemedText>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <ThemedText style={styles.statValue}>
            {typedStorage.itemCount}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Items Disposed</ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText style={styles.statValue}>
            {typedStorage.folderCount}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Folders</ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText style={styles.statValue}>
            {typedStorage.fileCount}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Files</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  usage: {
    fontSize: 14,
    opacity: 0.7,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    marginRight: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 4,
  },
  percentage: {
    fontSize: 14,
    fontWeight: "500",
    minWidth: 40,
    textAlign: "right",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },
  loadingText: {
    marginLeft: 8,
    opacity: 0.7,
  },
  errorText: {
    opacity: 0.7,
    textAlign: "center",
  },
});
