import { useUploadProgress } from "@/lib/contexts/upload-progress-context";
import { useValidationModal } from "@/lib/contexts/validation-modal-context";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { useItemOperations } from "./use-item-operations";
import {
  getValidationConfig,
  validateFilesBeforeUpload,
} from "./use-upload-validation";
import { useUserStorage } from "./use-user-storage";

export function useDragDrop(
  parentId?: string,
  onProcessingProgress?: (progress: {
    isProcessing: boolean;
    processedFiles: number;
    totalFiles: number;
    currentFile: string;
  }) => void,
) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { uploadingFiles, setUploadingFiles } = useUploadProgress();
  const { showValidationModal } = useValidationModal();
  const itemOperations = useItemOperations();
  const { data: storageData } = useUserStorage();
  const queryClient = useQueryClient();

  // Helper function to recursively process directory entries
  const processDirectory = async (
    directoryEntry: FileSystemDirectoryEntry,
    basePath: string = "",
    progressCallback?: (fileName: string) => void,
  ): Promise<File[]> => {
    const files: File[] = [];
    const currentPath = basePath
      ? `${basePath}/${directoryEntry.name}`
      : directoryEntry.name;

    const reader = directoryEntry.createReader();

    // Read all entries (may need multiple calls for large directories)
    const getAllEntries = async (): Promise<FileSystemEntry[]> => {
      const allEntries: FileSystemEntry[] = [];
      let entries: FileSystemEntry[];

      do {
        entries = await new Promise<FileSystemEntry[]>((resolve) => {
          reader.readEntries(resolve);
        });
        allEntries.push(...entries);
      } while (entries.length > 0);

      return allEntries;
    };

    const entries = await getAllEntries();

    for (const entry of entries) {
      if (entry.isFile) {
        // Report progress
        if (progressCallback) {
          progressCallback(`${currentPath}/${entry.name}`);
        }

        const file = await new Promise<File>((resolve) => {
          (entry as FileSystemFileEntry).file((originalFile) => {
            // Create a new file with the full path to preserve folder structure
            const fileWithPath = new File([originalFile], originalFile.name, {
              type: originalFile.type,
              lastModified: originalFile.lastModified,
            });

            // Add webkitRelativePath to preserve folder structure
            const relativePath = `${currentPath}/${originalFile.name}`;

            Object.defineProperty(fileWithPath, "webkitRelativePath", {
              value: relativePath,
              writable: false,
            });

            resolve(fileWithPath);
          });
        });
        files.push(file);
      } else if (entry.isDirectory) {
        // Recursively process subdirectories
        const subFiles = await processDirectory(
          entry as FileSystemDirectoryEntry,
          currentPath,
          progressCallback,
        );
        files.push(...subFiles);
      }
    }

    return files;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Auto-detect if folders are being dropped using webkitGetAsEntry
    const items = Array.from(e.dataTransfer.items);
    const hasFolder = items.some((item) => {
      const entry = item.webkitGetAsEntry?.();
      return entry?.isDirectory;
    });

    if (hasFolder) {
      // Extract folder names BEFORE processing (for empty folder handling)
      const allFolderNames: string[] = [];
      for (const item of items) {
        const entry = item.webkitGetAsEntry?.();
        if (entry?.isDirectory) {
          allFolderNames.push(entry.name);
        }
      }

      // Handle folder upload by reconstructing files with paths
      const allFiles: File[] = [];
      let processedFiles = 0;

      // Start progress tracking
      if (onProcessingProgress) {
        onProcessingProgress({
          isProcessing: true,
          processedFiles: 0,
          totalFiles: 0, // We don't know total yet
          currentFile: "Scanning folders...",
        });
      }

      for (const item of items) {
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          if (entry.isFile) {
            // Single file
            if (onProcessingProgress) {
              onProcessingProgress({
                isProcessing: true,
                processedFiles: processedFiles++,
                totalFiles: 0,
                currentFile: entry.name,
              });
            }

            const file = await new Promise<File>((resolve) => {
              (entry as FileSystemFileEntry).file(resolve);
            });
            allFiles.push(file);
          } else if (entry.isDirectory) {
            // Recursively process directory with progress callback
            const folderFiles = await processDirectory(
              entry as FileSystemDirectoryEntry,
              "",
              (fileName) => {
                if (onProcessingProgress) {
                  onProcessingProgress({
                    isProcessing: true,
                    processedFiles: processedFiles++,
                    totalFiles: 0,
                    currentFile: fileName,
                  });
                }
              },
            );
            allFiles.push(...folderFiles);
          }
        }
      }

      // Update progress with final count
      if (onProcessingProgress) {
        onProcessingProgress({
          isProcessing: true,
          processedFiles: allFiles.length,
          totalFiles: allFiles.length,
          currentFile: "Validating files...",
        });
      }

      if (allFiles.length === 0) {
        // Use the folder names we extracted before processing
        const emptyFolderNames = allFolderNames;

        // Clear processing progress
        if (onProcessingProgress) {
          onProcessingProgress({
            isProcessing: false,
            processedFiles: 0,
            totalFiles: 0,
            currentFile: "",
          });
        }

        // Create empty folders for the user
        if (emptyFolderNames.length > 0) {
          try {
            const createdFolders: string[] = [];

            for (const folderName of emptyFolderNames) {
              const response = await fetch("/api/items", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: folderName,
                  type: "folder",
                  parentId: parentId || null,
                }),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(
                  error.error || `Failed to create folder "${folderName}"`,
                );
              }

              createdFolders.push(folderName);
            }

            // Show success message
            const folderText =
              createdFolders.length === 1 ? "folder" : "folders";
            const folderList =
              createdFolders.length === 1
                ? `"${createdFolders[0]}"`
                : createdFolders.map((name) => `"${name}"`).join(", ");

            toast.success(
              `Empty ${folderText} ${folderList} created successfully!`,
            );

            // Invalidate queries to refresh the UI (same as regular uploads)
            queryClient.invalidateQueries({ queryKey: ["items"] });
            queryClient.invalidateQueries({ queryKey: ["folderChildren"] });
            queryClient.invalidateQueries({ queryKey: ["search"] });
            queryClient.invalidateQueries({ queryKey: ["user", "storage"] });
          } catch (error) {
            console.error("Failed to create empty folder:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to create folders";
            toast.error(errorMessage);
          }
        }

        return;
      }

      // Pre-validation before upload
      if (!storageData?.user) {
        toast.error("Unable to check storage limits. Please try again.");
        return;
      }

      const validationConfig = getValidationConfig();
      const validation = validateFilesBeforeUpload(
        allFiles,
        storageData.user,
        validationConfig,
      );

      // Clear processing progress
      if (onProcessingProgress) {
        onProcessingProgress({
          isProcessing: false,
          processedFiles: 0,
          totalFiles: 0,
          currentFile: "",
        });
      }

      // Show validation errors
      if (!validation.isValid) {
        showValidationModal(validation);
        return;
      }

      // Show warnings but allow upload to proceed
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          toast(warning, {
            duration: 4000,
            icon: "⚠️",
          });
        });
      }

      // Start upload with progress tracking
      try {
        await itemOperations.uploadFiles(allFiles, parentId, (progress) => {
          setUploadingFiles(progress);
        });

        // Show success message
        setTimeout(() => {
          toast.success(`Files and folders disposed successfully!`);
        }, 500);

        // Clear upload progress after showing completion briefly
        setTimeout(() => {
          setUploadingFiles([]);
        }, 2000);
      } catch (error) {
        console.error("Upload failed:", error);

        // Show error message
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        toast.error(errorMessage);

        // Clear upload progress
        setUploadingFiles([]);
      }
    } else {
      // Handle regular file upload (fallback to original logic)
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      // Pre-validation before upload
      if (!storageData?.user) {
        toast.error("Unable to check storage limits. Please try again.");
        return;
      }

      const validationConfig = getValidationConfig();
      const validation = validateFilesBeforeUpload(
        droppedFiles,
        storageData.user,
        validationConfig,
      );

      // Clear processing progress (in case it was running)
      if (onProcessingProgress) {
        onProcessingProgress({
          isProcessing: false,
          processedFiles: 0,
          totalFiles: 0,
          currentFile: "",
        });
      }

      // Show validation errors
      if (!validation.isValid) {
        showValidationModal(validation);
        return;
      }

      // Show warnings but allow upload to proceed
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          toast(warning, {
            duration: 4000,
            icon: "⚠️",
          });
        });
      }

      try {
        await itemOperations.uploadFiles(droppedFiles, parentId, (progress) => {
          setUploadingFiles(progress);
        });

        // Show success message
        setTimeout(() => {
          toast.success(`Files disposed successfully!`);
        }, 500);

        // Clear upload progress after showing completion briefly
        setTimeout(() => {
          setUploadingFiles([]);
        }, 2000);
      } catch (error) {
        console.error("Upload failed:", error);

        // Show error message
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        toast.error(errorMessage);

        // Clear upload progress
        setUploadingFiles([]);
      }
    }
  };

  return {
    isDragOver,
    uploadingFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
