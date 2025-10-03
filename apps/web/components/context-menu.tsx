"use client";

import { Download, Edit3, FolderOpen, Share, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    isFolder: boolean;
    type: string;
    isPublic: boolean;
  };
  onDownload?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onNavigate?: () => void;
  onRename?: () => void;
}

export function ContextMenu({
  x,
  y,
  isOpen,
  onClose,
  item,
  onDownload,
  onDelete,
  onShare,
  onNavigate,
  onRename,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position if menu would overflow
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10;
    }

    // Adjust vertical position if menu would overflow
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10;
    }

    setAdjustedPosition({ x: adjustedX, y: adjustedY });
  }, [x, y, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 rounded-md border border-gray-200 bg-white shadow-lg"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      <div className="py-1">
        {item.isFolder ? (
          <>
            {/* Share option */}
            {onShare && (
              <button
                onClick={() => handleAction(onShare)}
                className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Share className="h-4 w-4" />
                <span>Share Folder</span>
              </button>
            )}
            {onNavigate && (
              <button
                onClick={() => handleAction(onNavigate)}
                className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Open Folder</span>
              </button>
            )}
            {onRename && (
              <button
                onClick={() => handleAction(onRename)}
                className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit3 className="h-4 w-4" />
                <span>Rename</span>
              </button>
            )}
            <hr className="my-1 border-gray-100" />
            {onDelete && (
              <button
                onClick={() => handleAction(onDelete)}
                className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Folder</span>
              </button>
            )}
          </>
        ) : (
          <>
            {/* Share option */}
            {onShare && (
              <button
                onClick={() => handleAction(onShare)}
                className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Share className="h-4 w-4" />
                <span>Share</span>
              </button>
            )}
            {onDownload && (
              <button
                onClick={() => handleAction(onDownload)}
                className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            )}
            {onRename && (
              <button
                onClick={() => handleAction(onRename)}
                className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit3 className="h-4 w-4" />
                <span>Rename</span>
              </button>
            )}
            <hr className="my-1 border-gray-100" />
            {onDelete && (
              <button
                onClick={() => handleAction(onDelete)}
                className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
