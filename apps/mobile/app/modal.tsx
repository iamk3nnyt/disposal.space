import * as DocumentPicker from "expo-document-picker";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/lib/hooks/use-auth";
import { useItemOperations } from "@/lib/hooks/use-items";

export default function ModalScreen() {
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFiles } = useItemOperations();
  const { isSignedIn, isTokenReady } = useAuth();

  if (!isSignedIn || !isTokenReady) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            {!isSignedIn ? "Authentication Required" : "Preparing Upload"}
          </ThemedText>
          <ThemedText style={styles.description}>
            {!isSignedIn
              ? "Please sign in to upload files to your disposal space"
              : "Setting up your upload session..."}
          </ThemedText>
          {!isSignedIn ? (
            <Link href={"/sign-in" as any} dismissTo style={styles.link}>
              <ThemedText type="link">Sign In</ThemedText>
            </Link>
          ) : (
            <ActivityIndicator size="large" color="#16a34a" />
          )}
        </View>
      </ThemedView>
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
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Upload Files
        </ThemedText>
        <ThemedText style={styles.description}>
          Select files from your device to upload to your disposal space
        </ThemedText>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            isUploading && styles.uploadButtonDisabled,
          ]}
          onPress={handlePickFiles}
          disabled={isUploading}
        >
          {isUploading ? (
            <View style={styles.uploadingContent}>
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText style={styles.uploadButtonText}>
                Uploading...
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.uploadButtonText}>
              📁 Select Files
            </ThemedText>
          )}
        </TouchableOpacity>

        <Link href="/" dismissTo style={styles.link}>
          <ThemedText type="link">Cancel</ThemedText>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.7,
    fontSize: 16,
    lineHeight: 22,
  },
  uploadButton: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    minWidth: 200,
    alignItems: "center",
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  uploadingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
