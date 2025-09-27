"use client";

import { useFolderPath } from "@/lib/hooks/use-folder-path";
import {
  useItemOperations,
  useItems,
  type UploadProgress,
} from "@/lib/hooks/use-item-operations";
import { ArrowUpDown, Download, Eye, Home, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface FolderNavigationPageProps {
  params: Promise<{ path: string[] }>;
}

export default function FolderNavigationPage({
  params,
}: FolderNavigationPageProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadProgress[]>([]);

  // Resolve params
  const [resolvedParams, setResolvedParams] = useState<{
    path: string[];
  } | null>(null);

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Get the current folder path from URL
  const folderPath = resolvedParams?.path || [];

  // Resolve folder path to actual folder ID
  const {
    data: folderData,
    isLoading: isLoadingPath,
    error: pathError,
  } = useFolderPath(folderPath);

  // Get items for the resolved folder
  const { data: itemsData, isLoading: isLoadingItems } = useItems(
    folderData?.folderId,
  );
  const itemOperations = useItemOperations();

  const isLoading = isLoadingPath || isLoadingItems;
  const currentFolderName = folderData?.folderName || "Dashboard";

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const files = itemsData?.items || [];

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
        folderData?.folderId || undefined,
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  // Generate breadcrumb navigation
  const generateBreadcrumbs = () => {
    const breadcrumbs = [
      {
        name: "Dashboard",
        path: "/dashboard",
        isLast: folderPath.length === 0,
      },
    ];

    if (folderData?.path) {
      folderData.path.forEach((folder, index) => {
        const encodedPath = folderPath
          .slice(0, index + 1)
          .map(encodeURIComponent)
          .join("/");
        const path = `/dashboard/${encodedPath}`;
        const isLast = index === folderData.path.length - 1;
        breadcrumbs.push({ name: folder.name, path, isLast });
      });
    }

    return breadcrumbs;
  };

  // Error state for invalid paths
  if (pathError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Home className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Folder Not Found
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            The folder path you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

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

  // Error state for data loading (not path errors)
  if (!pathError && itemsData === undefined && !isLoadingItems) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-red-500">⚠️</div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Failed to load items
          </h3>
          <p className="text-sm text-gray-500">
            Something went wrong loading the folder contents
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <nav className="flex items-center space-x-2 text-sm">
          <Home className="h-4 w-4 text-gray-400" />
          {generateBreadcrumbs().map((breadcrumb, index) => (
            <div key={breadcrumb.path} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-400">/</span>}
              {breadcrumb.isLast ? (
                <span className="font-medium text-gray-900">
                  {breadcrumb.name}
                </span>
              ) : (
                <Link
                  href={breadcrumb.path}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {breadcrumb.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentFolderName}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {files.length} {files.length === 1 ? "item" : "items"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort
            </button>
          </div>
        </div>
      </div>

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
                          href={`/dashboard/${[...folderPath, encodeURIComponent(file.name)].join("/")}`}
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
                          onClick={async () => {
                            await itemOperations.preview(file.id, file.name);
                          }}
                          disabled={itemOperations.isDownloading}
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                          title="Preview file"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() =>
                            itemOperations.download(file.id, file.name)
                          }
                          disabled={itemOperations.isDownloading}
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                          title="Download file"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          onClick={async () => {
                            await itemOperations.delete(file.id);
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
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500">{file.size}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round(file.progress)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.status === "uploading" && "Disposing..."}
                      {file.status === "processing" && "Processing..."}
                      {file.status === "completed" && "Complete!"}
                      {file.status === "error" && "Error"}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
                {file.status === "error" && file.error && (
                  <p className="mt-1 text-xs text-red-600">{file.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="bg-opacity-90 absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-green-300 bg-green-50">
            <div className="text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <p className="text-lg font-medium text-green-700">
                Drop files here to dispose
              </p>
              <p className="text-sm text-green-600">
                Files will be uploaded to this folder
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
