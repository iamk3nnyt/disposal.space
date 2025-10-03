"use client";

import { ContextMenu } from "@/components/context-menu";
import { Pagination } from "@/components/pagination";
import { ShareModal } from "@/components/share-modal";
import { useSelection } from "@/lib/contexts/selection-context";
import { getFileIcon } from "@/lib/file-icons";
import { useContextMenu } from "@/lib/hooks/use-context-menu";
import { useDragDrop } from "@/lib/hooks/use-drag-drop";
import { useFolderPath } from "@/lib/hooks/use-folder-path";
import { useItemOperations, useItems } from "@/lib/hooks/use-item-operations";
import { usePagination } from "@/lib/hooks/use-pagination";
import {
  AlertTriangle,
  ArrowUpDown,
  Download,
  Folder,
  FolderX,
  Home,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  // Drag and drop functionality
  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } =
    useDragDrop(folderData?.folderId || undefined);
  const {
    contextMenu,
    closeContextMenu,
    handleRowClick,
    handleRowContextMenu,
  } = useContextMenu();

  // Share modal state
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    item: {
      id: string;
      name: string;
      isFolder: boolean;
      isPublic: boolean;
    } | null;
  }>({
    isOpen: false,
    item: null,
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

  // Share modal functions
  const openShareModal = (item: {
    id: string;
    name: string;
    isFolder: boolean;
    isPublic: boolean;
  }) => {
    setShareModal({ isOpen: true, item });
  };

  const closeShareModal = () => {
    setShareModal({ isOpen: false, item: null });
  };

  const handleTogglePublic = async (itemId: string, isPublic: boolean) => {
    await itemOperations.toggleItemPublic(itemId, isPublic);
    // Update the share modal item state
    if (shareModal.item && shareModal.item.id === itemId) {
      setShareModal((prev) => ({
        ...prev,
        item: prev.item ? { ...prev.item, isPublic } : null,
      }));
    }
  };

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
                    <tr
                      key={index}
                      className="group cursor-pointer hover:bg-gray-50"
                      onClick={(e) => handleRowClick(e, file)}
                      onContextMenu={(e) => handleRowContextMenu(e, file)}
                    >
                      <td className="py-4 pl-3">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          onClick={(e) => e.stopPropagation()}
                          onContextMenu={(e) => e.stopPropagation()}
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
                              onClick={(e) => e.stopPropagation()}
                              onContextMenu={(e) => e.stopPropagation()}
                            >
                              {file.name}
                            </Link>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
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
                              onContextMenu={(e) => e.stopPropagation()}
                              disabled={itemOperations.isDownloading}
                              className="text-left text-sm font-medium text-gray-900 hover:text-green-600 disabled:opacity-50"
                            >
                              {file.name}
                            </button>
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
                              onClick={(e) => {
                                e.stopPropagation();
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
                              onContextMenu={(e) => e.stopPropagation()}
                              disabled={itemOperations.isDownloading}
                              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                              title="Download file"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
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
                              onContextMenu={(e) => e.stopPropagation()}
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

        {/* Context Menu */}
        {contextMenu.item && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            isOpen={contextMenu.isOpen}
            onClose={closeContextMenu}
            item={contextMenu.item}
            onDownload={
              !contextMenu.item.isFolder
                ? () => {
                    const downloadPromise = itemOperations.download(
                      contextMenu.item!.id,
                      contextMenu.item!.name,
                    );
                    toast.promise(downloadPromise, {
                      loading: `Downloading "${contextMenu.item!.name}"...`,
                      success: `Downloaded "${contextMenu.item!.name}"`,
                      error: (err) =>
                        `Failed to download "${contextMenu.item!.name}": ${err instanceof Error ? err.message : "Download failed"}`,
                    });
                  }
                : undefined
            }
            onDelete={() => {
              const deletePromise = itemOperations.delete(contextMenu.item!.id);
              toast.promise(deletePromise, {
                loading: `Deleting "${contextMenu.item!.name}"...`,
                success: `"${contextMenu.item!.name}" deleted successfully`,
                error: (err) =>
                  err instanceof Error ? err.message : "Delete failed",
              });
            }}
            onShare={
              !contextMenu.item.isPublic
                ? () => {
                    openShareModal({
                      id: contextMenu.item!.id,
                      name: contextMenu.item!.name,
                      isFolder: contextMenu.item!.isFolder,
                      isPublic: contextMenu.item!.isPublic,
                    });
                    closeContextMenu();
                  }
                : undefined
            }
            onHide={
              contextMenu.item.isPublic
                ? () => {
                    openShareModal({
                      id: contextMenu.item!.id,
                      name: contextMenu.item!.name,
                      isFolder: contextMenu.item!.isFolder,
                      isPublic: contextMenu.item!.isPublic,
                    });
                    closeContextMenu();
                  }
                : undefined
            }
            onNavigate={
              contextMenu.item.isFolder
                ? () => {
                    router.push(
                      `/dashboard/${[...folderPath, encodeURIComponent(contextMenu.item!.name)].join("/")}`,
                    );
                  }
                : undefined
            }
            onRename={() => {
              // TODO: Implement rename functionality
              toast.success("Rename functionality coming soon!");
            }}
          />
        )}

        {/* Share Modal */}
        {shareModal.item && (
          <ShareModal
            isOpen={shareModal.isOpen}
            onClose={closeShareModal}
            item={shareModal.item}
            onTogglePublic={handleTogglePublic}
          />
        )}
      </div>
    </>
  );
}
