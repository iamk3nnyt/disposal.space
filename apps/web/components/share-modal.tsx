"use client";

import { Copy, Globe, Lock, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    isFolder: boolean;
    isPublic: boolean;
  };
  onTogglePublic: (itemId: string, isPublic: boolean) => Promise<void>;
}

export function ShareModal({
  isOpen,
  onClose,
  item,
  onTogglePublic,
}: ShareModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(item.isPublic);

  // Update local state when item prop changes
  useEffect(() => {
    setCurrentIsPublic(item.isPublic);
  }, [item.isPublic]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareUrl = currentIsPublic
    ? `${window.location.origin}/${item.isFolder ? "folder" : "file"}/${item.id}`
    : "";

  const handleCopyLink = async () => {
    if (!currentIsPublic) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleTogglePublic = async () => {
    setIsUpdating(true);
    try {
      const newIsPublic = !currentIsPublic;
      await onTogglePublic(item.id, newIsPublic);
      setCurrentIsPublic(newIsPublic);

      if (newIsPublic) {
        toast.success(`${item.isFolder ? "Folder" : "File"} is now public!`);
      } else {
        toast.success(`${item.isFolder ? "Folder" : "File"} is now private!`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update sharing status",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="mx-6 w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Modal Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center space-x-3">
            <Share2 className="h-5 w-5 text-gray-600" />
            <h2 className="text-base font-medium text-gray-900">
              Share {item.isFolder ? "Folder" : "File"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Item Info */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {item.isFolder ? "Folder" : "File"}:{" "}
              <span className="font-medium text-gray-900">{item.name}</span>
            </p>
          </div>

          {/* Public Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                {currentIsPublic ? (
                  <Globe className="h-5 w-5 text-green-600" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {currentIsPublic ? "Public" : "Private"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentIsPublic
                      ? "Anyone with the link can access this item"
                      : "Only you can access this item"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleTogglePublic}
                disabled={isUpdating}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  currentIsPublic
                    ? "bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                    : "bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                }`}
              >
                {isUpdating
                  ? "Updating..."
                  : currentIsPublic
                    ? "Make Private"
                    : "Make Public"}
              </button>
            </div>
          </div>

          {/* Share Link Section */}
          {currentIsPublic && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Share Link
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center space-x-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Anyone with this link can{" "}
                {item.isFolder
                  ? "view the folder contents"
                  : "view and download the file"}
                .
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Close
            </button>
            {currentIsPublic && (
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Link</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3">
          <p className="text-xs text-gray-500">Press ESC to close</p>
        </div>
      </div>
    </div>
  );
}
