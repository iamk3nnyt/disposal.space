"use client";

import { Pagination } from "@/components/pagination";
import { getFileIcon } from "@/lib/file-icons";
import { usePagination } from "@/lib/hooks/use-pagination";
import { formatFileSize } from "@/lib/utils";
import { Download, Eye, Folder, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  isFolder: boolean;
  isPublic: boolean;
  sizeBytes: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface FolderResponse {
  folder: FileItem;
  children: FileItem[];
  pagination: PaginationInfo;
  error?: string;
}

export default function SharedFolderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const folderId = params.id as string;
  const [folder, setFolder] = useState<FileItem | null>(null);
  const [children, setChildren] = useState<FileItem[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get pagination from URL
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = 10;

  // Setup pagination hook
  const pagination = usePagination({
    itemsPerPage,
    totalItems: paginationInfo?.totalCount || 0,
  });

  useEffect(() => {
    const fetchFolder = async () => {
      try {
        setLoading(true);
        const url = new URL(
          `/api/public/folders/${folderId}`,
          window.location.origin,
        );
        url.searchParams.set("page", currentPage.toString());
        url.searchParams.set("limit", itemsPerPage.toString());

        const response = await fetch(url.toString());
        const data: FolderResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch folder");
        }

        setFolder(data.folder);
        setChildren(data.children);
        setPaginationInfo(data.pagination);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load folder",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFolder();
  }, [folderId, currentPage]);

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/public/items/${fileId}?download=true`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate download link");
      }

      if (data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Download started!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="w-full border-b border-gray-100 bg-white px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/logo.png"
                  alt="disposal.space logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-xl font-semibold text-gray-900">
                  disposal.space
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Loading shared folder
            </h3>
            <p className="text-sm text-gray-500">
              Please wait while we fetch the folder contents...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="w-full border-b border-gray-100 bg-white px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/logo.png"
                  alt="disposal.space logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-xl font-semibold text-gray-900">
                  disposal.space
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Error State */}
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-red-50">
              <Folder className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              Folder Not Found
            </h1>
            <p className="mb-6 max-w-md text-sm text-gray-500">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Go to disposal.space
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!folder) return null;

  return (
    <div className="min-h-screen bg-white px-6">
      {/* Header */}
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="disposal.space logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xl font-semibold text-gray-900">
                disposal.space
              </span>
            </Link>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-12">
        {/* Folder Header */}
        <div className="mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-50 text-4xl">
                📁
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-semibold break-words text-gray-900">
                {folder.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {paginationInfo?.totalCount || children.length}{" "}
                  {(paginationInfo?.totalCount || children.length) === 1
                    ? "item"
                    : "items"}
                </span>
                <span>Modified {folder.lastModified}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Folder Contents */}
        {(paginationInfo?.totalCount || children.length) === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <Folder className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Empty Folder
            </h3>
            <p className="text-sm text-gray-500">
              This folder doesn&apos;t contain any public items.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Modified
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {children.map((item) => {
                  const itemIcon = item.isFolder
                    ? "📁"
                    : getFileIcon(item.type, item.name);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center text-xl">
                            {itemIcon}
                          </div>
                          <div className="min-w-0 flex-1">
                            {item.isFolder ? (
                              <Link
                                href={`/folder/${item.id}`}
                                className="text-sm font-medium break-words text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {item.name}
                              </Link>
                            ) : (
                              <Link
                                href={`/file/${item.id}`}
                                className="text-sm font-medium break-words text-gray-900 hover:text-gray-700 hover:underline"
                              >
                                {item.name}
                              </Link>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {item.isFolder ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            Folder
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            {item.type.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {item.isFolder ? "—" : formatFileSize(item.sizeBytes)}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {item.lastModified}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {item.isFolder ? (
                            <Link
                              href={`/folder/${item.id}`}
                              className="inline-flex items-center space-x-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Open</span>
                            </Link>
                          ) : (
                            <>
                              <Link
                                href={`/file/${item.id}`}
                                className="inline-flex items-center space-x-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                              >
                                <Eye className="h-3 w-3" />
                                <span>View</span>
                              </Link>
                              <button
                                onClick={() =>
                                  handleDownloadFile(item.id, item.name)
                                }
                                className="inline-flex items-center space-x-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {paginationInfo && paginationInfo.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            onPageChange={pagination.goToPage}
            onNextPage={pagination.goToNextPage}
            onPreviousPage={pagination.goToPreviousPage}
            totalItems={paginationInfo.totalCount}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            className="px-0 sm:px-0"
          />
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Shared via{" "}
            <Link
              href="/"
              className="font-medium text-gray-900 hover:underline"
            >
              disposal.space
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
