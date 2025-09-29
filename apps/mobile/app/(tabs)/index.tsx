import { FileList } from "@/components/file-list";
import { StorageInfo } from "@/components/storage-info";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/lib/hooks/use-auth";
import { FileItem } from "@/lib/types";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const { isLoaded, isSignedIn } = useAuth();

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

  if (!isLoaded) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
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
    <ThemedView style={styles.container}>
      <StorageInfo />
      <View style={styles.fileListContainer}>
        <FileList
          parentId={null} // Root level items
          onItemPress={handleItemPress}
          onRefresh={handleRefresh}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  fileListContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
});
