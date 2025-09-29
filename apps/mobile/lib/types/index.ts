// Shared types for the mobile app (matching web app)
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  storageUsed: number;
  storageLimit: number;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  isFolder: boolean;
  sizeBytes: number;
}

export interface ItemsResponse {
  items: FileItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  size: string;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
  isFolder?: boolean;
  fileCount?: {
    total: number;
    processed: number;
  };
}

export interface UserStorage {
  storageUsed: number;
  storageLimit: number;
  storageUsedFormatted: string;
  storageLimitFormatted: string;
  usagePercentage: number;
  itemCount: number;
  folderCount: number;
  fileCount: number;
}

export interface UserStorageResponse {
  user: {
    id: string;
    clerkUserId: string;
    email: string;
    name: string;
    storageUsed: number;
    storageLimit: number;
    storageUsedFormatted: string;
    storageLimitFormatted: string;
    storageUsedPercentage: number;
    storageAvailable: number;
    storageAvailableFormatted: string;
  };
  stats: {
    totalItems: number;
    fileCount: number;
    folderCount: number;
    deletedCount: number;
  };
}

export interface SearchResult {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  isFolder: boolean;
  sizeBytes: number;
  path: string;
  pathSegments: string[];
  parentId: string | null;
}

export interface FolderPathResponse {
  folderId: string | null;
  pathSegments: string[];
}
