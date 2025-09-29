import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/lib/hooks/use-auth";
import { useItemOperations } from "@/lib/hooks/use-items";

export default function ModalScreen() {
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFiles } = useItemOperations();
  const { isSignedIn, isTokenReady } = useAuth();

  if (!isSignedIn || !isTokenReady) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>
              {!isSignedIn ? "Authentication Required" : "Preparing Upload"}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {!isSignedIn
                ? "Please sign in to upload files to your disposal space"
                : "Setting up your upload session..."}
            </ThemedText>
          </View>

          {!isSignedIn ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/sign-in")}
              >
                <IconSymbol name="person" size={20} color="#16a34a" />
                <ThemedText style={styles.actionText}>Sign In</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actions}>
              <View style={styles.actionButton}>
                <ActivityIndicator size={20} color="#16a34a" />
                <ThemedText style={styles.actionText}>Loading...</ThemedText>
              </View>
            </View>
          )}

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

  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsUploading(true);

        // Create FormData
        const formData = new FormData();

        result.assets.forEach((asset, index) => {
          formData.append("files", {
            uri: asset.uri,
            type: asset.mimeType || "application/octet-stream",
            name: asset.name,
          } as any);
        });

        try {
          await uploadFiles.mutateAsync({
            files: formData,
            onProgress: (progress) => {
              console.log("Upload progress:", progress);
            },
          });

          Alert.alert(
            "Success",
            `${result.assets.length} file(s) uploaded successfully!`,
            [
              {
                text: "OK",
                onPress: () => router.dismiss(),
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
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Upload Files</ThemedText>
          <ThemedText style={styles.subtitle}>
            Select files from your device to upload to your disposal space
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isUploading && styles.actionButtonDisabled,
            ]}
            onPress={handlePickFiles}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <ActivityIndicator size={20} color="#16a34a" />
                <ThemedText style={styles.actionText}>Uploading...</ThemedText>
              </>
            ) : (
              <>
                <IconSymbol name="plus" size={20} color="#16a34a" />
                <ThemedText style={styles.actionText}>Select Files</ThemedText>
              </>
            )}
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
    opacity: 0.7,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 12,
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
