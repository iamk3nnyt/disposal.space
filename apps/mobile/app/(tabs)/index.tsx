import { FileList } from "@/components/file-list";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/lib/hooks/use-auth";
import { FileItem } from "@/lib/types";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { isLoaded, isSignedIn, isTokenReady } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in" as any);
    }
  }, [isLoaded, isSignedIn]);

  const handleItemPress = (item: FileItem) => {
    if (item.isFolder) {
      // TODO: Navigate to folder view
      Alert.alert("Folder Navigation", `Navigate to folder: ${item.name}`);
    } else {
      // TODO: Show file preview/actions
      Alert.alert("File Actions", `File: ${item.name}\nSize: ${item.size}`);
    }
  };

  const handleRefresh = () => {
    console.log("Refreshing file list...");
  };

  if (!isLoaded || !isTokenReady) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <ThemedText style={styles.loadingText}>
          {!isLoaded ? "Loading..." : "Preparing your disposal space..."}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!isSignedIn) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <ThemedText style={styles.loadingText}>Redirecting...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <View style={styles.brandIcon}>
              <ThemedText style={styles.brandIconText}>DS</ThemedText>
            </View>
            <View>
              <ThemedText style={styles.brandTitle}>Disposal Space</ThemedText>
              <ThemedText style={styles.brandSubtitle}>
                Hidden Archive
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
      <FileList
        parentId={null} // Root level items
        onItemPress={handleItemPress}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    width: 32,
    height: 32,
    backgroundColor: "#16a34a",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  brandIconText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    lineHeight: 16,
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 14,
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
});
