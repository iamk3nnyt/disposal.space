"use client";

import { getFileIcon } from "@/lib/file-icons";
import { formatFileSize } from "@/lib/utils";
import { Download, Eye, File, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
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

interface FileResponse {
  item: FileItem;
  downloadUrl?: string;
  error?: string;
}

export default function SharedFilePage() {
  const params = useParams();
  const fileId = params.id as string;
  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await fetch(`/api/public/items/${fileId}`);
        const data: FileResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch file");
        }

        if (data.item.isFolder) {
          setError(
            "This is a folder, not a file. Use the folder sharing link instead.",
          );
          return;
        }

        setFile(data.item);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileId]);

  const handleDownload = async () => {
    if (!file) return;

    setDownloading(true);
    try {
      const response = await fetch(`/api/public/items/${fileId}?download=true`);
      const data: FileResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate download link");
      }

      if (data.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Download started!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    } finally {
      setDownloading(false);
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

  const isPreviewable = (fileType: string): boolean => {
    const previewableTypes = [
      "PDF",
      "TXT",
      "MD",
      "JSON",
      "CSV",
      "JPG",
      "JPEG",
      "PNG",
      "GIF",
      "WEBP",
      "SVG",
      "MP4",
      "WEBM",
      "MP3",
      "WAV",
    ];
    return previewableTypes.includes(fileType.toUpperCase());
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
              Loading shared file
            </h3>
            <p className="text-sm text-gray-500">
              Please wait while we fetch the file details...
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
              <File className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              File Not Found
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

  if (!file) return null;

  const fileIcon = getFileIcon(file.type, file.name);

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

            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center space-x-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{downloading ? "Downloading..." : "Download"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* File Header */}
        <div className="mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-50 text-4xl">
                {fileIcon}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-semibold break-words text-gray-900">
                {file.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {file.type.toUpperCase()}
                </span>
                <span>{formatFileSize(file.sizeBytes)}</span>
                <span>•</span>
                <span>Modified {file.lastModified}</span>
              </div>
            </div>
          </div>
        </div>

        {/* File Preview Area */}
        <div className="mb-8">
          {isPreviewable(file.type) ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <Eye className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Preview Coming Soon
              </h3>
              <p className="text-sm text-gray-500">
                File preview will be available in a future update
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-3xl opacity-40">
                {fileIcon}
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Preview Not Available
              </h3>
              <p className="text-sm text-gray-500">
                This file type cannot be previewed in the browser
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center justify-center space-x-2 rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            <span>{downloading ? "Downloading..." : "Download File"}</span>
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Share2 className="h-5 w-5" />
            <span>Copy Link</span>
          </button>
        </div>

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
