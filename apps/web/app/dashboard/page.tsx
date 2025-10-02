"use client";

import { Pagination } from "@/components/pagination";
import { useSelection } from "@/lib/contexts/selection-context";
import { getFileIcon } from "@/lib/file-icons";
import { useDragDrop } from "@/lib/hooks/use-drag-drop";
import { useItemOperations, useItems } from "@/lib/hooks/use-item-operations";
import { usePagination } from "@/lib/hooks/use-pagination";
import {
  AlertTriangle,
  ArrowUpDown,
  Download,
  Eye,
  Folder,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Home() {
  const {
    selectedFiles,
    toggleFileSelection,
    toggleSelectAll,
    isAllSelected,
    isIndeterminate,
  } = useSelection();

  const itemOperations = useItemOperations();
  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } =
    useDragDrop(undefined);

  // Fetch items from API
  const { data: itemsData, isLoading, error } = useItems();
  const allFiles = itemsData?.items || [];

  // Pagination
  const pagination = usePagination({
    itemsPerPage: 10,
    totalItems: allFiles.length,
  });

  const files = pagination.getPageItems(allFiles);
  const fileIds = files.map((file) => file.id);

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
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
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
                Your disposal space is empty
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Start by uploading files or folders to organize your digital
                assets.
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
              <h3 className="mb-2 text-lg font-medium text-green-700">
                Drop files or folders to dispose
              </h3>
              <p className="text-sm text-green-600">
                Release to add files and folders to your disposal space
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
