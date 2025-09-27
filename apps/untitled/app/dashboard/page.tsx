"use client";

import {
  useItemOperations,
  useItems,
  type UploadProgress,
} from "@/lib/hooks/use-item-operations";
import { formatFileSize } from "@/lib/utils";
import { ArrowUpDown, Download, Eye, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadProgress[]>([]);
  const itemOperations = useItemOperations();

  // Fetch items from API
  const { data: itemsData, isLoading, error } = useItems();
  const files = itemsData?.items || [];

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file) => file.id));
    }
  };

  const isAllSelected = selectedFiles.length === files.length;
  const isIndeterminate =
    selectedFiles.length > 0 && selectedFiles.length < files.length;

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

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    // Start upload with progress tracking
    try {
      const result = await itemOperations.uploadFiles(
        droppedFiles,
        undefined,
        (progress) => {
          setUploadingFiles(progress);
        },
      );

      // Show success message
      setTimeout(() => {
        toast.success(
          `${result.files.length} file(s) disposed successfully! Total size: ${formatFileSize(result.totalSize)}`,
        );
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
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder":
        return "📁";
      case "DOCX":
        return "📄";
      case "PNG":
        return "🖼️";
      case "CODE":
        return "💾";
      case "XLS":
        return "📊";
      case "MP3":
        return "🎵";
      case "ZIP":
        return "🗜️";
      case "PAGE":
        return "📄";
      default:
        return "📄";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
          <p className="text-sm text-gray-500">
            Loading your disposal space...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-red-500">⚠️</div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Failed to load items
          </h3>
          <p className="text-sm text-gray-500">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* File List */}
      <div
        className="relative flex-1 overflow-auto py-3 pr-6 pl-3"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="overflow-x-auto py-3">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                <th className="w-12 pb-3 pl-3 font-medium">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </th>
                <th className="pb-3 font-medium">
                  <div className="flex items-center space-x-2">
                    <span>Name</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Size</th>
                <th className="pb-3 font-medium">Last modified</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {files.map((file) => (
                <tr key={file.id} className="group hover:bg-gray-50">
                  <td className="py-4 pl-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getFileIcon(file.type)}</div>
                      {file.isFolder ? (
                        <Link
                          href={`/dashboard/${encodeURIComponent(file.name)}`}
                          className="text-sm font-medium text-gray-900 hover:text-green-600"
                        >
                          {file.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          {file.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    {file.type !== "folder" && (
                      <span
                        className={
                          "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                        }
                      >
                        {file.type}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-sm text-gray-500">{file.size}</td>
                  <td className="py-4 text-sm text-gray-500">
                    {file.lastModified}
                  </td>
                  <td className="py-4">
                    {!file.isFolder && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const previewPromise = itemOperations.preview(
                              file.id,
                              file.name,
                            );
                            toast.promise(previewPromise, {
                              loading: `Opening preview for "${file.name}"...`,
                              success: `Preview opened for "${file.name}"`,
                              error: (err) =>
                                `Failed to preview "${file.name}": ${err instanceof Error ? err.message : "Preview failed"}`,
                            });
                          }}
                          disabled={itemOperations.isDownloading}
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                          title="Preview file"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            const downloadPromise = itemOperations.download(
                              file.id,
                              file.name,
                            );
                            toast.promise(downloadPromise, {
                              loading: `Downloading "${file.name}"...`,
                              success: `Downloaded "${file.name}"`,
                              error: (err) =>
                                `Failed to download "${file.name}": ${err instanceof Error ? err.message : "Download failed"}`,
                            });
                          }}
                          disabled={itemOperations.isDownloading}
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                          title="Download file"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            const deletePromise = itemOperations.delete(
                              file.id,
                            );
                            toast.promise(deletePromise, {
                              loading: `Deleting "${file.name}"...`,
                              success: (result) => {
                                let message = "Item deleted successfully";
                                if (result.sizeFreed && result.sizeFreed > 0) {
                                  const sizeFreedFormatted = formatFileSize(
                                    result.sizeFreed,
                                  );
                                  message += ` • ${sizeFreedFormatted} of storage freed`;
                                }
                                return message;
                              },
                              error: (err) =>
                                err instanceof Error
                                  ? err.message
                                  : "Delete failed",
                            });
                          }}
                          disabled={itemOperations.isDeleting}
                          className="inline-flex items-center rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                          title="Delete file"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <div className="absolute right-4 bottom-4 w-80 space-y-2">
            {uploadingFiles.map((file) => (
              <div
                key={file.fileName}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 text-green-500" />
                    <span className="truncate text-sm font-medium text-gray-900">
                      {file.fileName}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{file.size}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Disposing...</span>
                    <span>{Math.round(file.progress)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="bg-opacity-90 absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-green-300 bg-green-50">
            <div className="text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h3 className="mb-2 text-lg font-medium text-green-700">
                Drop files to dispose
              </h3>
              <p className="text-sm text-green-600">
                Release to add files to your disposal space
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
