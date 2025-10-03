"use client";

import {
  FileProcessingProvider,
  useFileProcessing,
} from "@/lib/contexts/file-processing-context";
import {
  SelectionProvider,
  useSelection,
} from "@/lib/contexts/selection-context";
import {
  UploadProgressProvider,
  useUploadProgress,
} from "@/lib/contexts/upload-progress-context";
import {
  ValidationModalProvider,
  useValidationModal,
} from "@/lib/contexts/validation-modal-context";
import { getFileIcon } from "@/lib/file-icons";
import { useFolderChildren } from "@/lib/hooks/use-folder-children";
import { useFolderPath } from "@/lib/hooks/use-folder-path";
import { useItemOperations, useItems } from "@/lib/hooks/use-item-operations";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useSearch, type SearchResult } from "@/lib/hooks/use-search";
import {
  getValidationConfig,
  validateFilesBeforeUpload,
} from "@/lib/hooks/use-upload-validation";
import { useUserStorage } from "@/lib/hooks/use-user-storage";
import { cn, formatFileSize } from "@/lib/utils";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  Edit3,
  File,
  Folder,
  FolderPlus,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type SidebarItem = {
  id: string;
  name: string;
  type: string;
  isActive?: boolean;
  isExpanded?: boolean;
  children?: { id: string; name: string; type: string }[];
};

// Header Title Component (Left side - Dashboard title or selection info)
function HeaderTitle() {
  const { selectedFiles, clearSelection } = useSelection();
  const pathname = usePathname();

  // Get current folder path segments for dynamic content
  const getCurrentFolderPath = () => {
    if (pathname === "/dashboard") {
      return [];
    }

    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length > 1 && pathSegments[0] === "dashboard") {
      return pathSegments
        .slice(1)
        .map((segment) => decodeURIComponent(segment));
    }

    return [];
  };

  const currentFolderPath = getCurrentFolderPath();

  if (selectedFiles.length > 0) {
    // Show selection info when files are selected
    return (
      <div className="-ml-1.5 flex items-center space-x-3">
        <button
          onClick={clearSelection}
          className="flex items-center justify-center rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Clear selection"
        >
          <X className="size-4.5" />
        </button>
        <span className="text-base font-medium text-gray-900">
          {selectedFiles.length === 1
            ? "1 item"
            : `${selectedFiles.length} items`}{" "}
          selected
        </span>
      </div>
    );
  }

  // Show normal title when no files are selected
  if (currentFolderPath.length > 0) {
    return (
      <nav className="flex items-center space-x-2 text-sm">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
          Dashboard
        </Link>
        {currentFolderPath.map((segment, index) => {
          const isLast = index === currentFolderPath.length - 1;
          const path = `/dashboard/${currentFolderPath
            .slice(0, index + 1)
            .map(encodeURIComponent)
            .join("/")}`;

          return (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-gray-400">/</span>
              {isLast ? (
                <span className="font-medium text-gray-900">
                  {decodeURIComponent(segment)}
                </span>
              ) : (
                <Link href={path} className="text-gray-600 hover:text-gray-900">
                  {decodeURIComponent(segment)}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  return <h2 className="text-base font-medium text-gray-900">Dashboard</h2>;
}

// Header Actions Component (Right side - Settings/Upload or Download/Delete)
function HeaderActions() {
  const { selectedFiles, clearSelection } = useSelection();
  const itemOperations = useItemOperations();
  const [isHeaderImportDropdownOpen, setIsHeaderImportDropdownOpen] =
    useState(false);
  const pathname = usePathname();

  // Get current folder path segments for dynamic content
  const getCurrentFolderPath = () => {
    if (pathname === "/dashboard") {
      return [];
    }

    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length > 1 && pathSegments[0] === "dashboard") {
      return pathSegments
        .slice(1)
        .map((segment) => decodeURIComponent(segment));
    }

    return [];
  };

  const currentFolderPath = getCurrentFolderPath();

  // Get folder data for current path (if in a folder)
  const { data: folderData } = useFolderPath(currentFolderPath);

  // Get items for current folder (root if no folder, or specific folder if in one)
  const { data: itemsData } = useItems(
    currentFolderPath.length === 0 ? null : folderData?.folderId,
  );

  const allFiles = itemsData?.items || [];

  // Get paginated files (assuming 10 items per page like in the pages)
  const pagination = usePagination({
    itemsPerPage: 10,
    totalItems: allFiles.length,
  });
  const files = pagination.getPageItems(allFiles);

  // Close import dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".import-dropdown")) {
        setIsHeaderImportDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Note: File upload and folder creation handlers are now passed as props
  // and handled by the parent component

  if (selectedFiles.length > 0) {
    // Show bulk actions when files are selected
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            const selectedItems = files
              .filter((file) => selectedFiles.includes(file.id))
              .map((file) => ({
                id: file.id,
                name: file.name,
                isFolder: file.isFolder,
              }));

            const downloadPromise = itemOperations.bulkDownload(selectedItems);
            toast.promise(downloadPromise, {
              loading: `Downloading ${selectedFiles.length} items...`,
              success: (result) => {
                let message = `Successfully downloaded ${result.success} items`;
                if (result.skipped > 0) {
                  message += ` (${result.skipped} folders skipped)`;
                }
                if (result.failed > 0) {
                  message += ` (${result.failed} failed)`;
                }
                return message;
              },
              error: (err) =>
                `Download failed: ${err instanceof Error ? err.message : "Unknown error"}`,
            });
          }}
          disabled={itemOperations.isBulkDownloading}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </button>
        <button
          onClick={() => {
            const deletePromise = itemOperations.bulkDelete(selectedFiles);
            toast.promise(deletePromise, {
              loading: `Deleting ${selectedFiles.length} items...`,
              success: (result) => {
                clearSelection(); // Clear selection after successful delete
                let message = `Successfully deleted ${result.success} items`;
                if (result.failed > 0) {
                  message += ` (${result.failed} failed)`;
                }
                return message;
              },
              error: (err) =>
                `Delete failed: ${err instanceof Error ? err.message : "Unknown error"}`,
            });
          }}
          disabled={itemOperations.isBulkDeleting}
          className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </button>
      </div>
    );
  }

  // Show normal header actions when no files are selected
  return (
    <div className="flex items-center space-x-3">
      <Link
        href="/dashboard/settings"
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        Settings
      </Link>
      {/* Header Import Dropdown */}
      <div className="import-dropdown relative">
        <button
          onClick={() =>
            setIsHeaderImportDropdownOpen(!isHeaderImportDropdownOpen)
          }
          className="flex items-center space-x-1 rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
        >
          <span>Import</span>
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              isHeaderImportDropdownOpen && "rotate-180",
            )}
          />
        </button>

        {/* Header Import Dropdown Menu */}
        {isHeaderImportDropdownOpen && (
          <div className="absolute top-full right-0 z-10 mt-1 w-40 rounded-md border border-gray-200 bg-white shadow-lg">
            <button
              onClick={() => {
                // TODO: Implement Google Drive import
                toast.success("Google Drive import coming soon!");
                setIsHeaderImportDropdownOpen(false);
              }}
              className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={2500}
                height={2166}
                viewBox="0 0 1443.061 1249.993"
                className="size-4"
              >
                <path
                  fill="#3777e3"
                  d="m240.525 1249.993 240.492-416.664h962.044l-240.514 416.664z"
                />
                <path
                  fill="#ffcf63"
                  d="M962.055 833.329h481.006L962.055 0H481.017z"
                />
                <path
                  fill="#11a861"
                  d="m0 833.329 240.525 416.664 481.006-833.328L481.017 0z"
                />
              </svg>
              <span>Google Drive</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: storageData } = useUserStorage();

  // Get current folder path segments for dynamic content
  const getCurrentFolderPath = () => {
    if (pathname === "/dashboard") {
      return [];
    }

    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length > 1 && pathSegments[0] === "dashboard") {
      return pathSegments
        .slice(1)
        .map((segment) => decodeURIComponent(segment));
    }

    return [];
  };

  const currentFolderPath = getCurrentFolderPath();

  // Get folder data for current path (if in a folder)
  const {
    data: folderData,
    isLoading: isFolderPathLoading,
    error: folderPathError,
  } = useFolderPath(currentFolderPath);

  // Get items for current folder (root if no folder, or specific folder if in one)
  const {
    data: itemsData,
    isLoading: isItemsLoading,
    error: itemsError,
  } = useItems(currentFolderPath.length === 0 ? null : folderData?.folderId);

  // Sidebar pagination with proper validation (same as main content)
  const sidebarPagination = usePagination({
    itemsPerPage: 10,
    totalItems: itemsData?.items?.length || 0,
  });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
  } = useSearch(searchQuery);
  const itemOperations = useItemOperations();
  const [folderActionsModal, setFolderActionsModal] = useState<{
    isOpen: boolean;
    folderId: string;
    folderName: string;
  }>({ isOpen: false, folderId: "", folderName: "" });
  const [renameValue, setRenameValue] = useState("");
  const { uploadingFiles, setUploadingFiles } = useUploadProgress();
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { validationModal, showValidationModal, hideValidationModal } =
    useValidationModal();
  const {
    layoutProcessingProgress,
    updateLayoutProcessingProgress,
    clearLayoutProcessing,
    pageProcessingProgress,
  } = useFileProcessing();

  // State for tracking expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  // Use TanStack Query to fetch children for expanded folders
  const expandedFolderIds = Array.from(expandedFolders);
  const { folderChildren } = useFolderChildren(expandedFolderIds);

  // Get user's display name with email fallback
  const getUserDisplayName = () => {
    if (!user) return "Loading...";

    // Try to get full name from Clerk user data
    const firstName = user.firstName;
    const lastName = user.lastName;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }

    // Fallback to email
    const email = user.emailAddresses?.[0]?.emailAddress;
    return email || "User";
  };

  // Get user's email for subtitle
  const getUserEmail = () => {
    return user?.emailAddresses?.[0]?.emailAddress || "";
  };

  // Get user's initials for avatar
  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    if (displayName === "Loading..." || displayName === "User") {
      return "DS";
    }

    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    } else if (names.length === 1 && names[0].length > 0) {
      return names[0][0].toUpperCase();
    }

    return "DS";
  };

  // Get current folder name for sidebar title
  const getCurrentFolderName = () => {
    if (pathname === "/dashboard") {
      return "DASHBOARD";
    }

    // Extract folder name from pathname like /dashboard/folder1/folder2
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length > 1 && pathSegments[0] === "dashboard") {
      // Get the last folder name and decode it
      const lastSegment = pathSegments[pathSegments.length - 1];
      const decodedName = decodeURIComponent(lastSegment);
      return decodedName.toUpperCase();
    }

    return "DASHBOARD";
  };

  // Determine overall loading state
  const isSidebarLoading = () => {
    // If we're in a folder, we need both folder resolution and items
    if (currentFolderPath.length > 0) {
      return isFolderPathLoading || isItemsLoading;
    }
    // If we're at root, we only need items
    return isItemsLoading;
  };

  // Determine if there's an error
  const sidebarError = folderPathError || itemsError;

  // Apply pagination to sidebar items using validated pagination
  const paginatedSidebarItems = useMemo(() => {
    const allSidebarItems = itemsData?.items || [];
    return sidebarPagination.getPageItems(allSidebarItems);
  }, [itemsData?.items, sidebarPagination]);

  // Convert current folder's items to sidebar format with children support
  const sidebarItems: SidebarItem[] =
    paginatedSidebarItems.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      isActive: false,
      children: folderChildren[item.id] || [],
    })) || [];

  const toggleSidebarItem = (itemId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Function to check if a folder is currently active based on pathname
  const isFolderActive = (folderName: string, level: number = 0) => {
    if (pathname === "/dashboard" && level === 0) return false;

    const pathSegments = pathname
      .replace("/dashboard", "")
      .split("/")
      .filter(Boolean);
    if (pathSegments.length === 0) return false;

    // Decode the path segment to match the folder name
    const decodedSegment = pathSegments[level]
      ? decodeURIComponent(pathSegments[level])
      : "";
    return decodedSegment === folderName;
  };

  // Function to check if any child of a folder is active (for parent highlighting)
  const hasActiveChild = (folderName: string) => {
    if (pathname === "/dashboard") return false;

    const pathSegments = pathname
      .replace("/dashboard", "")
      .split("/")
      .filter(Boolean);
    if (pathSegments.length < 2) return false;

    const decodedFirstSegment = pathSegments[0]
      ? decodeURIComponent(pathSegments[0])
      : "";
    return decodedFirstSegment === folderName;
  };

  // Handle logout functionality
  const handleLogout = async () => {
    try {
      await signOut({ redirectUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  // Handle create folder functionality
  const handleCreateFolderClick = () => {
    setIsUploadDropdownOpen(false);
    setIsCreateFolderModalOpen(true);
    setNewFolderName("");
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const currentParentId =
        currentFolderPath.length === 0
          ? undefined
          : folderData?.folderId || undefined;

      await toast.promise(
        itemOperations.createFolder(newFolderName.trim(), currentParentId),
        {
          loading: `Creating folder "${newFolderName.trim()}"...`,
          success: `Folder "${newFolderName.trim()}" created successfully`,
          error: (err) => `Failed to create folder: ${err.message}`,
        },
      );

      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
    } catch (error) {
      console.error("Create folder failed:", error);
    }
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
      const renamePromise = itemOperations.updateItem(
        folderActionsModal.folderId,
        {
          name: renameValue.trim(),
        },
      );

      toast.promise(renamePromise, {
        loading: `Renaming "${folderActionsModal.folderName}" to "${renameValue.trim()}"...`,
        success: `Folder renamed to "${renameValue.trim()}" successfully!`,
        error: (err) =>
          `Failed to rename folder: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
    closeFolderActions();
  };

  const handleDeleteFolder = () => {
    const deletePromise = itemOperations.delete(folderActionsModal.folderId);

    toast.promise(deletePromise, {
      loading: `Deleting "${folderActionsModal.folderName}" and all its contents...`,
      success: `"${folderActionsModal.folderName}" deleted successfully`,
      error: (err) =>
        `Failed to delete folder: ${err instanceof Error ? err.message : "Unknown error"}`,
    });

    closeFolderActions();
  };

  const processFilesWithProgress = async (
    files: FileList | File[],
  ): Promise<File[]> => {
    const fileArray = Array.from(files);

    // Check if this is a folder upload by looking for webkitRelativePath
    const hasWebkitRelativePath = fileArray.some(
      (file) =>
        (file as File & { webkitRelativePath?: string }).webkitRelativePath &&
        (file as File & { webkitRelativePath?: string }).webkitRelativePath !==
          "",
    );

    if (!hasWebkitRelativePath) {
      // Regular file upload - no processing needed
      return fileArray;
    }

    // Folder upload - show progress
    updateLayoutProcessingProgress({
      isProcessing: true,
      processedFiles: 0,
      totalFiles: fileArray.length,
      currentFile: "Processing folder contents...",
    });

    const processedFiles: File[] = [];

    // Calculate timing based on file count for better UX
    const totalFiles = fileArray.length;
    const baseDelay = Math.min(Math.max(totalFiles * 2, 500), 2000); // 500ms to 2s total
    const delayPerFile = baseDelay / totalFiles;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      // Update progress with 1-based counting for better UX
      updateLayoutProcessingProgress({
        processedFiles: i + 1,
        currentFile: file.name,
      });

      // Proportional delay based on total files for smoother progress
      await new Promise((resolve) => setTimeout(resolve, delayPerFile));

      processedFiles.push(file);
    }

    // Validation phase - show as separate step
    updateLayoutProcessingProgress({
      processedFiles: fileArray.length,
      currentFile: "Validating files...",
    });

    // Validation delay proportional to file count
    const validationDelay = Math.min(Math.max(totalFiles * 0.5, 200), 800);
    await new Promise((resolve) => setTimeout(resolve, validationDelay));

    return processedFiles;
  };

  const handleFileUpload = async (
    files: FileList | File[],
    parentId?: string,
  ) => {
    if (files.length === 0) return;

    try {
      // Process files with progress feedback
      const processedFiles = await processFilesWithProgress(files);

      // Clear processing progress
      clearLayoutProcessing();

      // Pre-validation before upload
      if (!storageData?.user) {
        toast.error("Unable to check storage limits. Please try again.");
        return;
      }

      const validationConfig = getValidationConfig();
      const validation = validateFilesBeforeUpload(
        processedFiles,
        storageData.user,
        validationConfig,
      );

      // Show validation errors
      if (!validation.isValid) {
        showValidationModal(validation);
        return;
      }

      // Show warnings but allow upload to proceed
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          toast(warning, {
            duration: 4000,
            icon: "⚠️",
          });
        });
      }

      // Start upload with progress tracking
      await itemOperations.uploadFiles(processedFiles, parentId, (progress) => {
        setUploadingFiles(progress);
      });

      // Show success message
      setTimeout(() => {
        toast.success(`Files disposed successfully!`);
      }, 500);

      // Clear upload progress after showing completion briefly
      setTimeout(() => {
        setUploadingFiles([]);
      }, 2000);
    } catch (error) {
      console.error("Upload failed:", error);

      // Clear processing progress on error
      clearLayoutProcessing();

      // Show error message
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      toast.error(errorMessage);

      // Clear upload progress
      setUploadingFiles([]);
    }
  };

  const triggerFileUpload = (uploadFolders = false, parentId?: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    // Enable folder upload if requested
    if (uploadFolders) {
      input.webkitdirectory = true;
      // Add additional attributes for better browser support
      input.setAttribute("directory", "");
      input.setAttribute("mozdirectory", "");
    }

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleFileUpload(target.files, parentId);
      }
    };
    input.click();
  };

  // Use real search results from API
  const searchResults = searchData?.items || [];
  const filteredResults = searchResults;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".upload-dropdown")) {
        setIsUploadDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle navigation from search results
  const handleSearchItemClick = (item: SearchResult) => {
    setIsSearchModalOpen(false);
    setSearchQuery("");

    if (item.type === "folder") {
      // Navigate to the folder itself
      if (item.pathSegments && item.pathSegments.length > 0) {
        // Navigate to the folder using its path segments + its own name
        const fullPath = [...item.pathSegments, item.name];
        const encodedPath = fullPath
          .map((segment) => encodeURIComponent(segment))
          .join("/");
        router.push(`/dashboard/${encodedPath}`);
      } else {
        // Root level folder
        router.push(`/dashboard/${encodeURIComponent(item.name)}`);
      }
    } else {
      // Navigate to the parent folder where the file resides
      if (item.pathSegments && item.pathSegments.length > 0) {
        // Navigate to the parent folder
        const encodedPath = item.pathSegments
          .map((segment) => encodeURIComponent(segment))
          .join("/");
        router.push(`/dashboard/${encodedPath}`);
      } else {
        // File is in root, navigate to dashboard root
        router.push("/dashboard");
      }
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
            <div className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
              {/* Sidebar Header */}
              <div className="flex h-16 min-h-16 items-center border-b border-gray-200 px-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                    <span className="text-sm font-medium text-white">
                      {getUserInitials()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {getUserDisplayName()}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {getUserEmail()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-1 px-4 py-3">
                {/* Upload Dropdown */}
                <div className="upload-dropdown relative">
                  <button
                    onClick={() =>
                      setIsUploadDropdownOpen(!isUploadDropdownOpen)
                    }
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-2">
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isUploadDropdownOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isUploadDropdownOpen && (
                    <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                      <button
                        onClick={() => {
                          const currentFolderId =
                            currentFolderPath.length === 0
                              ? undefined
                              : folderData?.folderId || undefined;
                          triggerFileUpload(false, currentFolderId);
                          setIsUploadDropdownOpen(false);
                        }}
                        className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <File className="h-4 w-4" />
                        <span>Upload Files</span>
                      </button>
                      <button
                        onClick={() => {
                          const currentFolderId =
                            currentFolderPath.length === 0
                              ? undefined
                              : folderData?.folderId || undefined;
                          triggerFileUpload(true, currentFolderId);
                          setIsUploadDropdownOpen(false);
                        }}
                        className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FolderPlus className="h-4 w-4" />
                        <span>Upload Folder</span>
                      </button>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleCreateFolderClick}
                        className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Folder className="h-4 w-4" />
                        <span>Create Folder</span>
                      </button>
                    </div>
                  )}
                </div>
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

              {/* File Tree - Only show for dashboard pages, not settings */}
              {pathname !== "/dashboard/settings" && (
                <div className="flex-1 overflow-hidden px-4 py-2">
                  <div className="mb-3 text-xs font-medium tracking-wider text-gray-400 uppercase">
                    {getCurrentFolderName()}
                  </div>
                  <div className="h-[calc(100vh-20rem)] space-y-0.5 overflow-y-auto pr-2">
                    {isSidebarLoading() ? (
                      // Loading state
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Loading...
                          </span>
                        </div>
                      </div>
                    ) : sidebarError ? (
                      // Error state
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center space-y-2 text-center">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                          <span className="text-xs text-red-600">
                            Failed to load folder
                          </span>
                          <span className="text-xs text-gray-500">
                            {sidebarError.message}
                          </span>
                        </div>
                      </div>
                    ) : sidebarItems.length === 0 ? (
                      // Empty state
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center space-y-2 text-center">
                          <Folder className="h-5 w-5 text-gray-300" />
                          <span className="text-xs text-gray-500">
                            This folder is empty
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Content state
                      sidebarItems.map((item) => (
                        <div key={item.id}>
                          <div
                            className={cn(
                              "flex items-center space-x-2 rounded-md px-2 py-1 text-sm",
                              isFolderActive(item.name, 0) ||
                                hasActiveChild(item.name)
                                ? "bg-gray-200 text-gray-900"
                                : "text-gray-700 hover:bg-gray-100",
                            )}
                          >
                            {item.type === "folder" ? (
                              <Link
                                href={
                                  currentFolderPath.length === 0
                                    ? `/dashboard/${encodeURIComponent(item.name)}`
                                    : `/dashboard/${currentFolderPath.map((segment) => encodeURIComponent(segment)).join("/")}/${encodeURIComponent(item.name)}`
                                }
                                className="flex flex-1 cursor-pointer items-center space-x-2 truncate"
                              >
                                <Folder className="h-4 w-4 shrink-0" />
                                <span className="truncate whitespace-nowrap">
                                  {item.name}
                                </span>
                              </Link>
                            ) : (
                              <div className="flex flex-1 cursor-pointer items-center space-x-2 truncate">
                                <File className="h-4 w-4 shrink-0" />
                                <span className="truncate whitespace-nowrap">
                                  {item.name}
                                </span>
                              </div>
                            )}
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
                                    triggerFileUpload(false, item.id);
                                  }}
                                  title="Upload files to this folder"
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
                                      expandedFolders.has(item.id)
                                        ? "rotate-90"
                                        : ""
                                    }`}
                                  />
                                </button>
                              </div>
                            )}
                          </div>
                          {item.children && expandedFolders.has(item.id) && (
                            <div className="mt-0.5 ml-6 space-y-0.5">
                              {item.children.map((child) => (
                                <div
                                  key={child.id}
                                  className={cn(
                                    "flex items-center space-x-2 rounded-md px-2 py-0.5 text-sm",
                                    isFolderActive(child.name, 1)
                                      ? "bg-gray-200 text-gray-900"
                                      : "text-gray-600 hover:bg-gray-100",
                                  )}
                                >
                                  {child.type === "folder" ? (
                                    <Link
                                      href={
                                        currentFolderPath.length === 0
                                          ? `/dashboard/${encodeURIComponent(item.name)}/${encodeURIComponent(child.name)}`
                                          : `/dashboard/${currentFolderPath.map((segment) => encodeURIComponent(segment)).join("/")}/${encodeURIComponent(item.name)}/${encodeURIComponent(child.name)}`
                                      }
                                      className="flex flex-1 cursor-pointer items-center space-x-2"
                                    >
                                      <Folder className="h-3 w-3 shrink-0" />
                                      <span>{child.name}</span>
                                    </Link>
                                  ) : (
                                    <div className="flex flex-1 cursor-pointer items-center space-x-2">
                                      <File className="h-3 w-3 shrink-0" />
                                      <span>{child.name}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Usage Details */}
              <div
                className={cn(
                  "sticky bottom-0 min-h-22 border-t border-gray-200 p-4",
                  pathname === "/dashboard/settings" && "mt-auto",
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Storage Used</span>
                    <span>
                      {storageData?.user.storageUsedFormatted || "0 Bytes"} of{" "}
                      {storageData?.user.storageLimitFormatted || "5 GB"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${storageData?.user.storageUsedPercentage || 0}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Items Disposed</span>
                    <span>{storageData?.stats.totalItems || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex h-full flex-1 flex-col">
              {/* Content Header */}
              {pathname === "/dashboard/settings" ? (
                <div className="flex h-16 min-h-16 w-full items-center justify-between border-b border-gray-200 px-6">
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Dashboard</span>
                    </Link>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href="mailto:kenny@ketryon.com"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Send feedback
                    </a>
                    <button
                      onClick={handleLogout}
                      className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-16 min-h-16 w-full items-center justify-between border-b border-gray-200 px-6">
                  <HeaderTitle />
                  <HeaderActions />
                </div>
              )}

              {children}

              {/* Layout File Processing Progress */}
              {layoutProcessingProgress.isProcessing && (
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
                          {layoutProcessingProgress.processedFiles} /{" "}
                          {layoutProcessingProgress.totalFiles}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all duration-300"
                            style={{
                              width: `${(layoutProcessingProgress.processedFiles / layoutProcessingProgress.totalFiles) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      {layoutProcessingProgress.currentFile && (
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {layoutProcessingProgress.currentFile}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Page File Processing Progress (for drag-and-drop) */}
              {pageProcessingProgress.isProcessing && (
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
                          {pageProcessingProgress.processedFiles} /{" "}
                          {pageProcessingProgress.totalFiles || "?"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all duration-300"
                            style={{
                              width:
                                pageProcessingProgress.totalFiles > 0
                                  ? `${(pageProcessingProgress.processedFiles / pageProcessingProgress.totalFiles) * 100}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                      {pageProcessingProgress.currentFile && (
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {pageProcessingProgress.currentFile}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploadingFiles.length > 0 && (
                <div className="fixed right-4 bottom-4 w-80 space-y-2">
                  {uploadingFiles.map((file) => (
                    <div
                      key={file.fileName + file.size}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate">
                          {!file.isFolder && (
                            <Upload className="h-4 w-4 shrink-0 text-green-500" />
                          )}
                          <span className="truncate text-sm font-medium text-gray-900">
                            {file.fileName}
                          </span>
                        </div>
                        <span className="text-xs whitespace-nowrap text-gray-500">
                          {file.size}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <p className="text-xs text-gray-500">
                            {file.status === "uploading" &&
                              (file.isFolder
                                ? "Disposing folder..."
                                : "Disposing...")}
                            {file.status === "processing" &&
                              (file.isFolder
                                ? "Processing files..."
                                : "Processing...")}
                            {file.status === "completed" &&
                              (file.isFolder
                                ? "Folder disposed!"
                                : "Complete!")}
                            {file.status === "error" && "Error"}
                          </p>
                          <span>{Math.round(file.progress)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                      {file.status === "error" && file.error && (
                        <p className="mt-1 text-xs text-red-600">
                          {file.error}
                        </p>
                      )}
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
              {isSearchLoading ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
                  <h3 className="mt-3 text-sm font-medium text-gray-900">
                    Searching...
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Finding your disposed items
                  </p>
                </div>
              ) : searchError ? (
                <div className="px-6 py-12 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
                  <h3 className="mt-3 text-sm font-medium text-gray-900">
                    Search failed
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {searchError instanceof Error
                      ? searchError.message
                      : "Something went wrong"}
                  </p>
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredResults.map((item) => (
                    <div
                      key={item.id}
                      className="group flex cursor-pointer items-center justify-between px-6 py-3 hover:bg-gray-50"
                      onClick={() => handleSearchItemClick(item)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">
                          {getFileIcon(item.type, item.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="truncate text-xs text-gray-500">
                            in {item.path} • {item.lastModified}
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
                {isSearchLoading
                  ? "Searching..."
                  : searchError
                    ? "Search failed"
                    : `${filteredResults.length} items found`}
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

      {/* Create Folder Modal */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-6 w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
              <div className="flex items-center space-x-3">
                <FolderPlus className="h-5 w-5 text-gray-600" />
                <h2 className="text-base font-medium text-gray-900">
                  Create New Folder
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsCreateFolderModalOpen(false);
                  setNewFolderName("");
                }}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Location:{" "}
                  <span className="font-medium text-gray-900">
                    {currentFolderPath.length === 0
                      ? "Root Directory"
                      : currentFolderPath[currentFolderPath.length - 1]}
                  </span>
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  placeholder="Enter folder name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 border-t border-gray-200 px-6 py-3">
              <button
                onClick={() => {
                  setIsCreateFolderModalOpen(false);
                  setNewFolderName("");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || itemOperations.isCreating}
                className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <FolderPlus className="h-4 w-4" />
                <span>
                  {itemOperations.isCreating ? "Creating..." : "Create Folder"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Validation Modal - Inlined */}
      {validationModal.isOpen && validationModal.validation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-6 w-full max-w-lg rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h2 className="text-base font-medium text-gray-900">
                  Upload Validation Failed
                </h2>
              </div>
              <button
                onClick={hideValidationModal}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Selected:{" "}
                  <span className="font-medium text-gray-900">
                    {validationModal.validation.fileCount} files
                  </span>{" "}
                  ({formatFileSize(validationModal.validation.totalSize)})
                </p>
              </div>

              {/* Errors */}
              {validationModal.validation.errors.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-medium text-red-800">
                    Issues Found:
                  </h3>
                  <div className="space-y-2">
                    {validationModal.validation.errors.map((error, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 text-sm text-red-700"
                      >
                        <span className="mt-0.5 text-red-500">•</span>
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Oversized Files (only shown if there are any - rare since we removed hard limits) */}
              {validationModal.validation.oversizedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-medium text-red-800">
                    Files Exceeding Configured Limits:
                  </h3>
                  <div className="max-h-32 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3">
                    <div className="space-y-1">
                      {validationModal.validation.oversizedFiles.map(
                        (file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-xs text-red-700"
                          >
                            <span className="truncate font-medium">
                              {file.name}
                            </span>
                            <span className="ml-2 flex-shrink-0">
                              {file.formattedSize}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationModal.validation.warnings.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-medium text-yellow-800">
                    Warnings:
                  </h3>
                  <div className="space-y-2">
                    {validationModal.validation.warnings.map(
                      (warning, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-2 text-sm text-yellow-700"
                        >
                          <span className="mt-0.5 text-yellow-500">•</span>
                          <span>{warning}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-gray-200 px-6 py-3">
              <button
                onClick={hideValidationModal}
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <SelectionProvider>
        <UploadProgressProvider>
          <ValidationModalProvider>
            <FileProcessingProvider>
              <DashboardLayoutContent>{children}</DashboardLayoutContent>
            </FileProcessingProvider>
          </ValidationModalProvider>
        </UploadProgressProvider>
      </SelectionProvider>
    </Suspense>
  );
}
