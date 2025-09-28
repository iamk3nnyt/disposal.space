import { useState } from "react";
import toast from "react-hot-toast";
import { useItemOperations, type UploadProgress } from "./use-item-operations";

export function useDragDrop(parentId?: string) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadProgress[]>([]);
  const itemOperations = useItemOperations();

  // Helper function to recursively process directory entries
  const processDirectory = async (
    directoryEntry: FileSystemDirectoryEntry,
    basePath: string = "",
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
      // Handle folder upload by reconstructing files with paths
      const allFiles: File[] = [];

      for (const item of items) {
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          if (entry.isFile) {
            // Single file
            const file = await new Promise<File>((resolve) => {
              (entry as FileSystemFileEntry).file(resolve);
            });
            allFiles.push(file);
          } else if (entry.isDirectory) {
            // Recursively process directory
            const folderFiles = await processDirectory(
              entry as FileSystemDirectoryEntry,
            );
            allFiles.push(...folderFiles);
          }
        }
      }

      if (allFiles.length === 0) return;

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
