"use client";

import { Pagination } from "@/components/pagination";
import { useSelection } from "@/lib/contexts/selection-context";
import { getFileIcon } from "@/lib/file-icons";
import { useDragDrop } from "@/lib/hooks/use-drag-drop";
import { useFolderPath } from "@/lib/hooks/use-folder-path";
import { useItemOperations, useItems } from "@/lib/hooks/use-item-operations";
import { usePagination } from "@/lib/hooks/use-pagination";
import {
  AlertTriangle,
  ArrowUpDown,
  Download,
  Eye,
  Folder,
  FolderX,
  Home,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import toast from "react-hot-toast";

interface FolderNavigationPageProps {
  params: Promise<{ path: string[] }>;
}

export default function FolderNavigationPage({
  params,
}: FolderNavigationPageProps) {
  const {
    selectedFiles,
    toggleFileSelection,
    toggleSelectAll,
    isAllSelected,
    isIndeterminate,
  } = useSelection();
  const [fileProcessingProgress, setFileProcessingProgress] = useState<{
    isProcessing: boolean;
    processedFiles: number;
    totalFiles: number;
    currentFile: string;
  }>({
    isProcessing: false,
    processedFiles: 0,
    totalFiles: 0,
    currentFile: "",
  });

  // Resolve params using React 18 use() hook
  const resolvedParams = use(params);

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

  // Drag and drop functionality
  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } =
    useDragDrop(folderData?.folderId || undefined, (progress) => {
      setFileProcessingProgress(progress);
    });

  const isLoading = isLoadingPath || isLoadingItems;

  const allFiles = itemsData?.items || [];

  // Pagination
  const pagination = usePagination({
    itemsPerPage: 10,
    totalItems: allFiles.length,
  });

  const files = pagination.getPageItems(allFiles);
  const fileIds = files.map((file) => file.id);

  // Error state for invalid paths
  if (pathError) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <FolderX className="mx-auto mb-4 h-12 w-12 text-gray-400" />
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
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
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
    <>
      {/* File List */}
      <div
        className="relative flex-1 overflow-auto"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {allFiles.length === 0 ? (
          // Empty state
          <div className="flex min-h-[calc(100vh-4rem)] min-w-[800px] items-center justify-center">
            <div className="text-center">
              <Folder className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                This folder is empty
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Upload files to this folder or create subfolders to organize
                your content.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="my-6 mr-6 ml-3 overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                    <th className="w-12 pb-3 pl-3 font-medium">
                      <input
                        type="checkbox"
                        checked={isAllSelected(fileIds)}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate(fileIds);
                        }}
                        onChange={() => toggleSelectAll(fileIds)}
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
                  {files.map((file, index) => (
                    <tr key={index} className="group hover:bg-gray-50">
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
                          <div className="text-2xl">
                            {getFileIcon(file.type, file.name)}
                          </div>
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
                      <td className="py-4 text-sm text-gray-500">
                        {file.size}
                      </td>
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
                                  success: `"${file.name}" deleted successfully`,
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

            {/* Pagination */}
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              onPageChange={pagination.goToPage}
              onNextPage={pagination.goToNextPage}
              onPreviousPage={pagination.goToPreviousPage}
              totalItems={allFiles.length}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
            />
          </>
        )}

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="bg-opacity-90 sticky inset-0 flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-green-300 bg-green-50">
            <div className="text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <p className="text-lg font-medium text-green-700">
                Drop files or folders here to dispose
              </p>
              <p className="text-sm text-green-600">
                Files and folders will be uploaded to this folder
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File Processing Progress */}
      {fileProcessingProgress.isProcessing && (
        <div className="fixed right-4 bottom-4 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"></div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium text-gray-900">
                  Processing folder...
                </p>
                <span className="text-gray-500">
                  {fileProcessingProgress.processedFiles} /{" "}
                  {fileProcessingProgress.totalFiles || "?"}
                </span>
              </div>
              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all duration-300"
                    style={{
                      width:
                        fileProcessingProgress.totalFiles > 0
                          ? `${(fileProcessingProgress.processedFiles / fileProcessingProgress.totalFiles) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
              {fileProcessingProgress.currentFile && (
                <p className="mt-1 truncate text-xs text-gray-500">
                  {fileProcessingProgress.currentFile}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
