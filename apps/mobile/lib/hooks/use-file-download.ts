import { ApiService } from "@/services/api";
import { useMutation } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number;
}

interface DownloadOptions {
  showProgress?: boolean;
  saveToGallery?: boolean;
  onProgress?: (progress: DownloadProgress) => void;
}

export function useFileDownload() {
  return useMutation({
    mutationFn: async ({
      itemId,
      fileName,
      options = {},
    }: {
      itemId: string;
      fileName: string;
      options?: DownloadOptions;
    }) => {
      try {
        // Get the preview URL from the API
        const { url, mimeType } = await ApiService.getItemPreviewUrl(itemId);

        // Download the file using new API
        const downloadedFile = await File.downloadFileAsync(url, Paths.cache);

        // Handle different file types and platform-specific behavior
        const isImage = mimeType?.startsWith("image/");
        const isVideo = mimeType?.startsWith("video/");

        // For images and videos, optionally save to gallery
        if ((isImage || isVideo) && options.saveToGallery) {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === "granted") {
            await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
            Alert.alert(
              "Success",
              `${fileName} has been saved to your ${isImage ? "Photos" : "Videos"} library.`
            );
            return downloadedFile;
          }
        }

        // For other files or when not saving to gallery, use sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadedFile.uri, {
            mimeType,
            dialogTitle: `Save ${fileName}`,
            UTI: mimeType,
          });
        } else {
          Alert.alert(
            "Download Complete",
            `${fileName} has been downloaded to: ${downloadedFile.uri}`
          );
        }

        return downloadedFile;
      } catch (error) {
        console.error("Download error:", error);
        throw error;
      }
    },
    onError: (error: Error) => {
      Alert.alert(
        "Download Failed",
        error.message || "An error occurred while downloading the file."
      );
    },
  });
}

// Hook for getting download progress (if needed for large files)
export function useFileDownloadWithProgress() {
  return useMutation({
    mutationFn: async ({
      itemId,
      fileName,
      onProgress,
    }: {
      itemId: string;
      fileName: string;
      onProgress?: (progress: DownloadProgress) => void;
    }) => {
      try {
        const { url, mimeType } = await ApiService.getItemPreviewUrl(itemId);

        // For progress tracking, we'll use the legacy API temporarily
        // as the new API doesn't have built-in progress callbacks yet
        const fileUri = `${Paths.cache.uri}/${fileName}`;

        // Create a download resumable for progress tracking
        const downloadResumable = FileSystem.createDownloadResumable(
          url,
          fileUri,
          {},
          (downloadProgress) => {
            const progress = {
              totalBytesWritten: downloadProgress.totalBytesWritten,
              totalBytesExpectedToWrite:
                downloadProgress.totalBytesExpectedToWrite,
              progress:
                downloadProgress.totalBytesWritten /
                downloadProgress.totalBytesExpectedToWrite,
            };
            onProgress?.(progress);
          }
        );

        const downloadResult = await downloadResumable.downloadAsync();

        if (!downloadResult) {
          throw new Error("Download failed");
        }

        if (downloadResult.status !== 200) {
          throw new Error(
            `Download failed with status: ${downloadResult.status}`
          );
        }

        // Share the downloaded file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType,
            dialogTitle: `Save ${fileName}`,
            UTI: mimeType,
          });
        }

        return downloadResult;
      } catch (error) {
        console.error("Download with progress error:", error);
        throw error;
      }
    },
    onError: (error: Error) => {
      Alert.alert(
        "Download Failed",
        error.message || "An error occurred while downloading the file."
      );
    },
  });
}
