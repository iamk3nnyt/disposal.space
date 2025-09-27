"use client";

import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronRight,
  Edit3,
  File,
  Folder,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SidebarItem = {
  id: string;
  name: string;
  type: string;
  isActive?: boolean;
  isExpanded?: boolean;
  children?: { id: string; name: string; type: string }[];
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderActionsModal, setFolderActionsModal] = useState<{
    isOpen: boolean;
    folderId: string;
    folderName: string;
  }>({ isOpen: false, folderId: "", folderName: "" });
  const [renameValue, setRenameValue] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<
    { name: string; progress: number; size: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([
    {
      id: "old-projects",
      name: "Old Projects",
      type: "folder",
      isActive: true,
      isExpanded: false,
    },
    { id: "random-docs", name: "Random Docs", type: "file" },
    {
      id: "maybe-later",
      name: "Maybe Later",
      type: "folder",
      isExpanded: true,
      children: [
        { id: "old-resume", name: "old_resume.pdf", type: "file" },
        { id: "random-notes", name: "random_notes.txt", type: "file" },
        { id: "maybe-useful", name: "maybe_useful.zip", type: "file" },
        { id: "forgotten-photos", name: "forgotten_photos", type: "folder" },
        {
          id: "old-presentations",
          name: "old_presentations.pptx",
          type: "file",
        },
        { id: "unused-assets", name: "Unused Assets", type: "folder" },
        { id: "temp-downloads", name: "Temp Downloads", type: "folder" },
      ],
    },
  ]);

  const toggleSidebarItem = (itemId: string) => {
    setSidebarItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isExpanded: !item.isExpanded } : item,
      ),
    );
  };

  const openFolderActions = (folderId: string, folderName: string) => {
    setFolderActionsModal({ isOpen: true, folderId, folderName });
    setRenameValue(folderName);
  };

  const closeFolderActions = () => {
    setFolderActionsModal({ isOpen: false, folderId: "", folderName: "" });
    setRenameValue("");
  };

  const handleRenameFolder = () => {
    if (renameValue.trim() && renameValue !== folderActionsModal.folderName) {
      setSidebarItems((prev) =>
        prev.map((item) =>
          item.id === folderActionsModal.folderId
            ? { ...item, name: renameValue.trim() }
            : item,
        ),
      );
    }
    closeFolderActions();
  };

  const handleDeleteFolder = () => {
    setSidebarItems((prev) =>
      prev.filter((item) => item.id !== folderActionsModal.folderId),
    );
    closeFolderActions();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const simulateUpload = (file: File) => {
    return new Promise<void>((resolve) => {
      const fileInfo = {
        name: file.name,
        progress: 0,
        size: formatFileSize(file.size),
      };

      setUploadingFiles((prev) => [...prev, fileInfo]);

      const interval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? {
                  ...f,
                  progress: Math.min(f.progress + Math.random() * 15 + 5, 100),
                }
              : f,
          ),
        );
      }, 200);

      // Complete upload after 2-4 seconds
      const uploadTime = 2000 + Math.random() * 2000;
      setTimeout(() => {
        clearInterval(interval);
        setUploadingFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, progress: 100 } : f)),
        );

        // Remove from uploading list after showing completion
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
          resolve();
        }, 1000);
      }, uploadTime);
    });
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 0) {
      setIsUploading(true);

      // Simulate uploading each file
      const uploadPromises = fileArray.map((file) => simulateUpload(file));

      try {
        await Promise.all(uploadPromises);
        // Show success message briefly
        setTimeout(() => {
          alert(`${fileArray.length} file(s) disposed successfully!`);
        }, 500);
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const triggerFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleFileUpload(target.files);
      }
    };
    input.click();
  };

  // Mock search results
  const mockSearchResults = [
    {
      id: "1",
      name: "old_resume.pdf",
      type: "PDF",
      size: "2.1MB",
      location: "Maybe Later",
      lastModified: "Mar. 15 2024",
    },
    {
      id: "2",
      name: "random_notes.txt",
      type: "TXT",
      size: "45KB",
      location: "Maybe Later",
      lastModified: "Jun. 08 2024",
    },
    {
      id: "3",
      name: "project_proposal.docx",
      type: "DOCX",
      size: "1.2MB",
      location: "Old Projects",
      lastModified: "Feb. 10 2024",
    },
    {
      id: "4",
      name: "vacation_photos",
      type: "folder",
      size: "",
      location: "Random Docs",
      lastModified: "Dec. 03 2023",
    },
    {
      id: "5",
      name: "maybe_useful.zip",
      type: "ZIP",
      size: "156MB",
      location: "Maybe Later",
      lastModified: "Jan. 22 2024",
    },
    {
      id: "6",
      name: "old_presentations.pptx",
      type: "PPTX",
      size: "89MB",
      location: "Maybe Later",
      lastModified: "Nov. 14 2023",
    },
  ];

  const filteredResults = searchQuery
    ? mockSearchResults.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : mockSearchResults;

  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder":
        return "📁";
      case "PDF":
        return "📄";
      case "TXT":
        return "📝";
      case "DOCX":
        return "📄";
      case "ZIP":
        return "🗜️";
      case "PPTX":
        return "📊";
      default:
        return "📄";
    }
  };

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isSearchModalOpen) {
          setIsSearchModalOpen(false);
          setSearchQuery("");
        } else if (folderActionsModal.isOpen) {
          closeFolderActions();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchModalOpen, folderActionsModal.isOpen]);

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="h-screen">
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50">
              {/* Sidebar Header */}
              <div className="flex h-16 items-center border-b border-gray-200 px-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                    <span className="text-sm font-medium text-white">DS</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Disposal Space</div>
                    <div className="text-xs text-gray-500">Hidden Archive</div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-1 px-4 py-3">
                <button
                  onClick={triggerFileUpload}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </button>
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Search className="h-4 w-4" />
                  <span>Find</span>
                </button>
                <Link
                  href="/dashboard/settings"
                  className={cn(
                    "flex w-full items-center space-x-2 rounded-md px-2 py-1 text-sm",
                    pathname === "/dashboard/settings"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </div>

              {/* File Tree */}
              <div className="px-4 py-2">
                <div className="mb-3 text-xs font-medium tracking-wider text-gray-400 uppercase">
                  DISPOSED
                </div>
                <div className="space-y-0.5">
                  {sidebarItems.map((item) => (
                    <div key={item.id}>
                      <div
                        className={cn(
                          "flex cursor-pointer items-center space-x-2 rounded-md px-2 py-1 text-sm",
                          item.isActive && pathname === "/dashboard"
                            ? "bg-gray-200 text-gray-900"
                            : "text-gray-700 hover:bg-gray-100",
                        )}
                      >
                        <div className="flex flex-1 items-center space-x-2 truncate">
                          {item.type === "folder" ? (
                            <Folder className="h-4 w-4 shrink-0" />
                          ) : (
                            <File className="h-4 w-4 shrink-0" />
                          )}
                          <span className="truncate whitespace-nowrap">
                            {item.name}
                          </span>
                        </div>
                        {item.type === "folder" && (
                          <div className="flex items-center space-x-1">
                            <button
                              className="rounded p-0.5 hover:bg-gray-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                openFolderActions(item.id, item.name);
                              }}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </button>
                            <button
                              className="rounded p-0.5 hover:bg-gray-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerFileUpload();
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              className="rounded p-0.5 hover:bg-gray-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSidebarItem(item.id);
                              }}
                            >
                              <ChevronRight
                                className={`h-3 w-3 transition-transform ${
                                  item.isExpanded ? "rotate-90" : ""
                                }`}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                      {item.children && item.isExpanded && (
                        <div className="mt-0.5 ml-6 space-y-0.5">
                          {item.children.map((child) => (
                            <div
                              key={child.id}
                              className="flex cursor-pointer items-center space-x-2 rounded-md px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100"
                            >
                              {child.type === "folder" ? (
                                <Folder className="h-3 w-3" />
                              ) : (
                                <File className="h-3 w-3" />
                              )}
                              <span>{child.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Details */}
              <div className="mt-auto border-t border-gray-200 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Storage Used</span>
                    <span>2.4 GB of 15 GB</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div className="h-1.5 w-1/6 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Items Disposed</span>
                    <span>247</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex h-full flex-1 flex-col">
              {/* Content Header */}
              {pathname === "/dashboard/settings" ? (
                <div className="flex h-16 w-full items-center justify-between border-b border-gray-200 px-6">
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Dashboard</span>
                    </Link>
                  </div>
                  {/* <div className="flex items-center space-x-3">
                    <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                      Reset
                    </button>
                    <button className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800">
                      Save Changes
                    </button>
                  </div> */}
                </div>
              ) : (
                <div className="flex h-16 w-full items-center justify-between border-b border-gray-200 px-6">
                  <div className="flex items-center">
                    <h2 className="text-base font-medium text-gray-900">
                      Maybe Later
                    </h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/dashboard/settings"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={triggerFileUpload}
                      className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
                    >
                      Upload
                    </button>
                  </div>
                </div>
              )}

              {children}

              {/* Upload Progress */}
              {uploadingFiles.length > 0 && (
                <div className="absolute right-4 bottom-4 w-80 space-y-2">
                  {uploadingFiles.map((file) => (
                    <div
                      key={file.name}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Upload className="h-4 w-4 text-green-500" />
                          <span className="truncate text-sm font-medium text-gray-900">
                            {file.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {file.size}
                        </span>
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
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-6 w-full max-w-2xl rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-gray-600" />
                <h2 className="text-base font-medium text-gray-900">
                  Find Disposed Items
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsSearchModalOpen(false);
                  setSearchQuery("");
                }}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-6 py-4">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, type, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-80 overflow-y-auto">
              {filteredResults.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredResults.map((item) => (
                    <div
                      key={item.id}
                      className="group flex cursor-pointer items-center justify-between px-6 py-3 hover:bg-gray-50"
                      onClick={() => {
                        // Handle item selection
                        console.log("Selected item:", item);
                        setIsSearchModalOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">{getFileIcon(item.type)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="truncate text-xs text-gray-500">
                            in {item.location} • {item.lastModified}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {item.type !== "folder" && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {item.type}
                          </span>
                        )}
                        {item.size && (
                          <span className="text-xs text-gray-500">
                            {item.size}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Search className="mx-auto h-8 w-8 text-gray-300" />
                  <h3 className="mt-3 text-sm font-medium text-gray-900">
                    No items found
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {searchQuery
                      ? `No disposed items match "${searchQuery}"`
                      : "Start typing to search your disposed items"}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
              <span className="text-xs text-gray-500">
                {filteredResults.length} items found
              </span>
              <span className="text-xs text-gray-400">Press ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Folder Actions Modal */}
      {folderActionsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-6 w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
              <div className="flex items-center space-x-3">
                <Folder className="h-5 w-5 text-gray-600" />
                <h2 className="text-base font-medium text-gray-900">
                  Folder Actions
                </h2>
              </div>
              <button
                onClick={closeFolderActions}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Managing folder:{" "}
                  <span className="font-medium text-gray-900">
                    {folderActionsModal.folderName}
                  </span>
                </p>
              </div>

              {/* Rename Section */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Rename Folder
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                    placeholder="Enter new folder name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRenameFolder();
                      }
                    }}
                  />
                  <button
                    onClick={handleRenameFolder}
                    disabled={
                      !renameValue.trim() ||
                      renameValue === folderActionsModal.folderName
                    }
                    className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Rename</span>
                  </button>
                </div>
              </div>

              {/* Delete Section */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start space-x-3">
                  <Trash2 className="mt-0.5 h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      Delete Folder
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      This action cannot be undone. The folder and all its
                      contents will be permanently removed.
                    </p>
                    <button
                      onClick={handleDeleteFolder}
                      className="mt-3 inline-flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Folder</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-gray-200 px-6 py-3">
              <button
                onClick={closeFolderActions}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
